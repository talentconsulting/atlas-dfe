# Hosting the catalogue viewer on Azure

This repository can host its own catalogue viewer on Azure Container Apps, behind Microsoft Entra sign-in,
and redeploy it whenever the catalogue changes. Everything needed is here:

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
- **Built-in authentication** on the Container App, with an Entra app registration. Every request must be
  signed in; no catalogue data is served to anyone who isn't.

## Security

The catalogue gathers open Dependabot alerts, OWASP API security findings, database schemas (with tables
flagged as holding personal data) and APIM routing for every service in one place, so it's treated as
sensitive:

- **Sign-in:** Container Apps built-in authentication with Microsoft Entra ID. The app registration has
  **Assignment required** on, so only the users and groups assigned to it can sign in, and Conditional
  Access and MFA apply as for any app in the tenant.
- **Transport:** HTTPS only; plain HTTP isn't accepted.
- **Image:** the image contains the catalogue, so the registry is private and is pulled only by the app's
  managed identity.
- **No secrets:** sign-in uses the ID token flow, so there's no client secret to store or rotate, and the
  deploy workflow signs in to Azure with OIDC.

Not included, because a hosting organisation applies its own standards:

| Control | When you'd add it |
| --- | --- |
| Ingress IP restrictions | Users always come from known networks. Container Apps ingress supports allow-lists directly. |
| Azure Front Door with WAF | It's reachable by people outside your tenant, or policy requires a WAF in front of web apps. |
| VNet-integrated environment with internal ingress | Nothing may be reachable from the internet; users come in over VPN or ExpressRoute. Needs private DNS. |
| Custom domain | Add it to the Container App with a free managed certificate, then add `https://<domain>/.auth/login/aad/callback` as a redirect URI. |

## One-time setup

You need `az` (signed in), `gh`, Owner (or Contributor plus Role Based Access Control Administrator) on the
subscription, and permission to create app registrations in Entra ID.

**1. Choose names** and copy `infra/viewer.poc.bicepparam` (for example to `infra/viewer.bicepparam`), setting
`namePrefix`, a globally unique `registryName` (`az acr check-name -n <name>`), `catalogueRepositoryUrl` and
`tags`.

**2. Create the resource group:**

```bash
az group create --name <resource-group> --location uksouth
```

**3. Create the sign-in app registration**, with ID tokens enabled and assignment required:

```bash
signin_app=$(az ad app create --display-name "Atlas catalogue viewer" --sign-in-audience AzureADMyOrg \
  --enable-id-token-issuance true --query appId -o tsv)
signin_sp=$(az ad sp create --id "$signin_app" --query id -o tsv)
az ad sp update --id "$signin_sp" --set appRoleAssignmentRequired=true
```

**4. Deploy the infrastructure.** The first deployment runs a placeholder image:

```bash
VIEWER_ENTRA_CLIENT_ID=$signin_app az deployment group create --resource-group <resource-group> \
  --template-file infra/viewer.bicep --parameters infra/viewer.bicepparam --query properties.outputs
```

**5. Add the redirect URI** from the `entraRedirectUri` output:

```bash
az ad app update --id "$signin_app" --web-redirect-uris "<entraRedirectUri>"
```

**6. Let people sign in** by assigning a group (or users) to the app: in the Entra admin centre, open
**Enterprise applications**, select the app, then **Users and groups**, then **Add user/group**. Or:

```bash
group=$(az ad group show --group "<group name>" --query id -o tsv)
az rest --method post --url "https://graph.microsoft.com/v1.0/servicePrincipals/$signin_sp/appRoleAssignedTo" \
  --body "{\"principalId\": \"$group\", \"resourceId\": \"$signin_sp\", \"appRoleId\": \"00000000-0000-0000-0000-000000000000\"}"
```

**7. Create the deploy identity** that GitHub Actions uses. It needs Contributor on this resource group only.
Look up the repository's OIDC subject prefix first, because organisations can customise it:

```bash
gh api repos/<owner>/<repository>/actions/oidc/customization/sub   # sub_claim_prefix, if not using the default
deploy_app=$(az ad app create --display-name "Atlas catalogue viewer deploy" --query appId -o tsv)
deploy_sp=$(az ad sp create --id "$deploy_app" --query id -o tsv)
az ad app federated-credential create --id "$deploy_app" --parameters '{
  "name": "github-viewer",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "<sub_claim_prefix, or repo:<owner>/<repository>>:environment:viewer",
  "audiences": ["api://AzureADTokenExchange"]
}'
az role assignment create --assignee-object-id "$deploy_sp" --assignee-principal-type ServicePrincipal \
  --role Contributor --scope "$(az group show --name <resource-group> --query id -o tsv)"
```

**8. Configure GitHub:** create an environment called `viewer` in this repository, and set:

| Name | Kind | Value |
| --- | --- | --- |
| `AZURE_CLIENT_ID` | Secret | `$deploy_app` |
| `AZURE_TENANT_ID` | Secret | Your tenant ID (`az account show --query tenantId -o tsv`) |
| `AZURE_SUBSCRIPTION_ID` | Secret | The subscription ID |
| `VIEWER_RESOURCE_GROUP` | Variable | The resource group |
| `VIEWER_CONTAINER_APP` | Variable | `namePrefix` |
| `VIEWER_REGISTRY` | Variable | `registryName` |

```bash
gh api -X PUT repos/<owner>/<repository>/environments/viewer
gh secret set AZURE_CLIENT_ID --env viewer --body "$deploy_app"
# ...and the rest of the table, with gh secret set / gh variable set --env viewer
```

**9. Deploy:** run **Deploy catalogue viewer** from the Actions tab. It builds the image in the registry,
points the app at it and rolls out a new revision; the run summary shows the address.

## How updates reach the viewer

Every push to `main`, including each merged catalogue pull request, runs **Deploy catalogue viewer**. It
builds a new image tagged with the commit and replaces the running revision, so the viewer shows the merged
catalogue a few minutes later. A newer push cancels a deployment still in progress.

To change the infrastructure later, redeploy the template with the current image, so it isn't reset to the
placeholder:

```bash
VIEWER_IMAGE=$(az containerapp show --resource-group <resource-group> --name <namePrefix> \
  --query "properties.template.containers[0].image" -o tsv) \
VIEWER_ENTRA_CLIENT_ID=$signin_app az deployment group create --resource-group <resource-group> \
  --template-file infra/viewer.bicep --parameters infra/viewer.bicepparam
```

## Cost

With `minReplicas = 0`, compute is billed only while someone is using it, which for a catalogue viewer is
usually within the Container Apps free grant. The Basic registry is about £4 a month and Log Analytics is
billed on the (small) volume of logs. Keeping one replica warm adds roughly £10-15 a month.

## Running it locally

`visualizer/Dockerfile` and `visualizer/docker-compose.yaml` still run the viewer against this checkout
without Azure; see the [README](README.md#catalogue-viewer).
