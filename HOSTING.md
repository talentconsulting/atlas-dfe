# Hosting the catalogue viewer on Azure

This repository can host its own catalogue viewer on Azure Container Apps, behind the viewer's username and
password login, and redeploy it whenever the catalogue changes. Everything needed is here:

| File | What it does |
| --- | --- |
| [`Dockerfile`](Dockerfile) | Builds one image holding the viewer and this repository's catalogue |
| [`infra/viewer.bicep`](infra/viewer.bicep) | Creates the Azure resources |
| [`infra/viewer.poc.bicepparam`](infra/viewer.poc.bicepparam) | Settings for Talent Consulting's proof of concept. Copy it for another host. |
| [`.github/workflows/deploy-viewer.yml`](.github/workflows/deploy-viewer.yml) | Rebuilds and redeploys the viewer on every push to `main` |

It doesn't depend on `talentsuite-atlas-backend` or its Azure resources, so whoever owns this repository can
host it in their own subscription.

## What gets created

All in one resource group:

- **Container App** `<namePrefix>`: the viewer, on HTTPS only, with 0.25 vCPU and 0.5 GiB. It scales to zero
  when idle by default (`minReplicas = 0`), so the first visit after a quiet spell takes a few seconds; set
  `minReplicas = 1` to keep it warm.
- **Container Apps environment** `<namePrefix>-env` and **Log Analytics workspace** `<namePrefix>-logs` for
  its logs.
- **Container registry** `<registryName>` (Basic, private). The admin user is off.
- **Managed identity** `<namePrefix>-pull`, which the app pulls its image with (`AcrPull` on the registry
  only). No registry password is stored anywhere.

## Security

The catalogue gathers open Dependabot alerts, OWASP API security findings, database schemas (with tables
flagged as holding personal data) and APIM routing for every service in one place, so it's treated as
sensitive:

- **Login:** the viewer's HTTP Basic authentication. Every request needs the username and password; without
  them the viewer returns 401 and the browser asks for them. The password is a Container App secret, passed
  to the viewer as `AUTH_PASSWORD`, and never stored in the repository or the image.
- **No lockout:** the viewer doesn't slow down or block repeated wrong passwords, so the password must be
  long and random. The template rejects one shorter than 20 characters; generate 32 or more (see below).
  Share it through a password manager, and change it when someone leaves.
- **One shared login:** everyone uses the same username and password, so the viewer can't tell users apart
  or remove one person's access without changing the password for everyone. If that matters, put Microsoft
  Entra sign-in in front instead (Container Apps built-in authentication), which needs no code changes.
- **Transport:** HTTPS only; plain HTTP isn't accepted, so the password is never sent unencrypted.
- **Image:** the image contains the catalogue, so the registry is private and is pulled only by the app's
  managed identity.
- **Deployment:** the deploy workflow signs in to Azure with OIDC, so no Azure credentials are stored in
  GitHub.

Not included, because a hosting organisation applies its own standards:

| Control | When you'd add it |
| --- | --- |
| Ingress IP restrictions | Users always come from known networks. Container Apps ingress supports allow-lists directly, and it's the simplest way to stop password guessing from anywhere else. |
| Microsoft Entra sign-in | Each person should sign in as themselves, with MFA and per-person access. |
| Azure Front Door with WAF | It's reachable by people outside your organisation, or policy requires a WAF and rate limiting in front of web apps. |
| VNet-integrated environment with internal ingress | Nothing may be reachable from the internet; users come in over VPN or ExpressRoute. Needs private DNS. |
| Custom domain | Add it to the Container App with a free managed certificate. |

## One-time setup

You need `az` (signed in), `gh`, and Owner (or Contributor plus Role Based Access Control Administrator) on
the subscription. Step 4 also needs permission to create an app registration in Entra ID, for the deploy
workflow's identity.

**1. Choose names** and copy `infra/viewer.poc.bicepparam` (for example to `infra/viewer.bicepparam`), setting
`namePrefix`, a globally unique `registryName` (`az acr check-name -n <name>`), `catalogueRepositoryUrl` and
`tags`.

**2. Create the resource group:**

```bash
az group create --name <resource-group> --location uksouth
```

**3. Generate a password and deploy the infrastructure.** The first deployment runs a placeholder image
until the workflow builds the real one. Store the password in your password manager straight away:

```bash
export VIEWER_AUTH_PASSWORD=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)
az deployment group create --resource-group <resource-group> \
  --template-file infra/viewer.bicep --parameters infra/viewer.bicepparam --query properties.outputs
```

The username is `admin` unless you set `authUsername`.

**4. Create the deploy identity** that GitHub Actions uses. It needs Contributor on this resource group only.
Look up the repository's OIDC subject prefix first, because organisations can customise it:

```bash
gh api repos/<owner>/<repository>/actions/oidc/customization/sub   # sub_claim_prefix, if not using the default
```

Then run steps 4 and 5 in the same terminal, so `$deploy_app` carries over:

```bash
rg=<resource-group>
deploy_app=$(az ad app create --display-name "Atlas catalogue viewer deploy" --query appId -o tsv)
deploy_sp=$(az ad sp create --id "$deploy_app" --query id -o tsv)

az ad app federated-credential create --id "$deploy_app" --parameters '{
  "name": "github-viewer",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "<sub_claim_prefix, or repo:<owner>/<repository>>:environment:viewer",
  "audiences": ["api://AzureADTokenExchange"]
}'

sleep 20   # let the new identity reach Azure RBAC
az role assignment create --assignee-object-id "$deploy_sp" --assignee-principal-type ServicePrincipal \
  --role Contributor --scope "$(az group show --name "$rg" --query id -o tsv)"
```

**5. Configure GitHub:** create an environment called `viewer` in this repository, and set:

| Name | Kind | Value |
| --- | --- | --- |
| `AZURE_CLIENT_ID` | Secret | `$deploy_app` |
| `AZURE_TENANT_ID` | Secret | Your tenant ID (`az account show --query tenantId -o tsv`) |
| `AZURE_SUBSCRIPTION_ID` | Secret | The subscription ID |
| `VIEWER_RESOURCE_GROUP` | Variable | The resource group |
| `VIEWER_CONTAINER_APP` | Variable | `namePrefix` |
| `VIEWER_REGISTRY` | Variable | `registryName` |

```bash
R=<owner>/<repository>
gh api -X PUT repos/$R/environments/viewer

gh secret set AZURE_CLIENT_ID       --env viewer -R $R --body "$deploy_app"
gh secret set AZURE_TENANT_ID       --env viewer -R $R --body "$(az account show --query tenantId -o tsv)"
gh secret set AZURE_SUBSCRIPTION_ID --env viewer -R $R --body "$(az account show --query id -o tsv)"

gh variable set VIEWER_RESOURCE_GROUP --env viewer -R $R --body "$rg"
gh variable set VIEWER_CONTAINER_APP  --env viewer -R $R --body <namePrefix>
gh variable set VIEWER_REGISTRY       --env viewer -R $R --body <registryName>
```

The viewer's password isn't needed here: the workflow only replaces the image, and the password stays in
the Container App.

**6. Deploy:** run **Deploy catalogue viewer** from the Actions tab, or push to `main`. GitHub only offers a
workflow in the Actions tab once it's on the default branch, so when the workflow arrives in a pull request,
merging it is the first run. It builds the image in the registry, points the app at it and rolls out a new
revision; the run summary shows the address.

If the run fails at **Sign in to Azure**, check the federated credential's `subject` matches the
repository's OIDC subject exactly, or wait a minute for the role assignment to take effect and re-run it.

**7. Check it:** open the address, sign in with the username and password, and confirm the catalogue loads.
Then merge a catalogue pull request and watch the viewer pick it up a few minutes later.

### The proof of concept's values

Talent Consulting's proof of concept uses [`infra/viewer.poc.bicepparam`](infra/viewer.poc.bicepparam) and:

| Setting | Value |
| --- | --- |
| Resource group | `atlas-viewer-poc-rg` (UK South) |
| `namePrefix` / Container App | `atlas-dfe-viewer` |
| `registryName` | `atlasdfeviewerpoc` |
| Deploy identity | `Atlas DfE viewer deploy (proof of concept)` |
| OIDC subject | `repo:talentconsulting@80040422/atlas-dfe@1321708655:environment:viewer` |

This organisation includes owner and repository IDs in its OIDC subject, so it differs from the default
`repo:talentconsulting/atlas-dfe:environment:viewer`.

Every resource the proof of concept uses, and the only role each identity has:

![Azure resources for the viewer proof of concept. In Entra ID, the deploy app registration's federated credential trusts atlas-dfe's viewer environment, and its service principal has Contributor on the resource group. In the Development subscription, atlas-viewer-poc-rg in UK South holds the Container Apps environment and its Container App, the managed identity the app pulls with (AcrPull on the registry), the Basic container registry and the Log Analytics workspace.](docs/diagrams/viewer-resources.svg)

## How updates reach the viewer

Every push to `main`, including each merged catalogue pull request, runs **Deploy catalogue viewer**. It
builds a new image tagged with the commit and replaces the running revision, so the viewer shows the merged
catalogue a few minutes later. A newer push cancels a deployment still in progress.

## Changing the password

Update the secret and restart the app so it picks the new value up:

```bash
new_password=$(LC_ALL=C tr -dc 'A-Za-z0-9' </dev/urandom | head -c 32)
az containerapp secret set --resource-group <resource-group> --name <namePrefix> \
  --secrets "auth-password=$new_password"
az containerapp revision restart --resource-group <resource-group> --name <namePrefix> \
  --revision "$(az containerapp show --resource-group <resource-group> --name <namePrefix> \
    --query properties.latestRevisionName -o tsv)"
```

## Changing the infrastructure

Redeploy the template with the current image, so it isn't reset to the placeholder, and the current
password (or a new one):

```bash
export VIEWER_IMAGE=$(az containerapp show --resource-group <resource-group> --name <namePrefix> \
  --query "properties.template.containers[0].image" -o tsv)
export VIEWER_AUTH_PASSWORD=<the current password>
az deployment group create --resource-group <resource-group> \
  --template-file infra/viewer.bicep --parameters infra/viewer.bicepparam
```

## Cost

With `minReplicas = 0`, compute is billed only while someone is using it, which for a catalogue viewer is
usually within the Container Apps free grant. The Basic registry is about £4 a month and Log Analytics is
billed on the (small) volume of logs. Keeping one replica warm adds roughly £10-15 a month.

## Running it locally

`visualizer/Dockerfile` and `visualizer/docker-compose.yaml` still run the viewer against this checkout
without Azure; see the [README](README.md#catalogue-viewer).
