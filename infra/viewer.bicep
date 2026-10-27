// Hosts the catalogue viewer on Azure Container Apps, behind Microsoft Entra sign-in.
//
// Deploys into an existing resource group: a private container registry, a managed identity the app pulls
// its image with, a Log Analytics workspace, a Container Apps environment and the viewer app. Sign-in is the
// Container Apps built-in authentication with an Entra app registration; who may sign in is controlled in
// Entra by assigning users or groups to that app. HOSTING.md describes the one-time setup around this.
targetScope = 'resourceGroup'

@description('Region for every resource.')
param location string = resourceGroup().location

@description('Prefix for resource names, for example atlas-dfe-viewer.')
param namePrefix string

@description('Container registry name. Globally unique, 5-50 letters and digits.')
param registryName string

@description('Image to run, as <registry>.azurecr.io/<repository>:<tag>. Leave empty on the first deployment, before an image has been pushed: a placeholder runs until the deploy workflow replaces it.')
param image string = ''

@description('Application (client) ID of the Entra app registration users sign in through.')
param entraClientId string

@description('Entra tenant users sign in from.')
param entraTenantId string = tenant().tenantId

@description('GitHub URL of the catalogue repository, so findings link to the generated files.')
param catalogueRepositoryUrl string

@description('Replicas kept running. 0 scales to zero when idle (a few seconds\' start on the next visit); 1 keeps it warm.')
@minValue(0)
param minReplicas int = 0

@description('Tags applied to every resource.')
param tags object = {}

// Built-in role definition ID.
var acrPullRoleId = '7f951dda-4ed3-4680-a7ca-43fe172d538d'
var placeholderImage = 'mcr.microsoft.com/k8se/quickstart:latest'

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${namePrefix}-logs'
  location: location
  tags: tags
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// The image contains the catalogue, including vulnerability and security findings, so the registry is
// private and pulled only with the app's managed identity: no admin user, no stored password.
resource registry 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: registryName
  location: location
  tags: tags
  sku: { name: 'Basic' }
  properties: {
    adminUserEnabled: false
  }
}

resource pullIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${namePrefix}-pull'
  location: location
  tags: tags
}

resource pullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: registry
  name: guid(registry.id, pullIdentity.id, acrPullRoleId)
  properties: {
    principalId: pullIdentity.properties.principalId
    principalType: 'ServicePrincipal'
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', acrPullRoleId)
  }
}

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${namePrefix}-env'
  location: location
  tags: tags
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logs.properties.customerId
        sharedKey: logs.listKeys().primarySharedKey
      }
    }
  }
}

resource viewer 'Microsoft.App/containerApps@2024-03-01' = {
  name: namePrefix
  location: location
  tags: tags
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: { '${pullIdentity.id}': {} }
  }
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8080
        transport: 'auto'
        allowInsecure: false
      }
      registries: empty(image) ? [] : [
        {
          server: registry.properties.loginServer
          identity: pullIdentity.id
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'viewer'
          image: empty(image) ? placeholderImage : image
          resources: { cpu: json('0.25'), memory: '0.5Gi' }
          env: [
            { name: 'CATALOGUE_REPOSITORY_URL', value: catalogueRepositoryUrl }
          ]
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: 2
      }
    }
  }
  dependsOn: [pullRole]
}

// Every request must be signed in; unauthenticated visitors are sent to Entra. Sign-in needs no client secret:
// it uses the ID token flow, so the app registration needs "ID tokens" enabled and the redirect URI output below.
resource auth 'Microsoft.App/containerApps/authConfigs@2024-03-01' = {
  parent: viewer
  name: 'current'
  properties: {
    platform: { enabled: true }
    globalValidation: {
      unauthenticatedClientAction: 'RedirectToLoginPage'
      redirectToProvider: 'azureactivedirectory'
    }
    identityProviders: {
      azureActiveDirectory: {
        enabled: true
        registration: {
          clientId: entraClientId
          openIdIssuer: '${az.environment().authentication.loginEndpoint}${entraTenantId}/v2.0'
        }
        validation: {
          allowedAudiences: [entraClientId, 'api://${entraClientId}']
        }
      }
    }
    login: {
      preserveUrlFragmentsForLogins: true
    }
  }
}

@description('The viewer\'s address.')
output url string = 'https://${viewer.properties.configuration.ingress.fqdn}'

@description('Redirect URI to add to the Entra app registration (Web platform).')
output entraRedirectUri string = 'https://${viewer.properties.configuration.ingress.fqdn}/.auth/login/aad/callback'

output registryLoginServer string = registry.properties.loginServer
output containerAppName string = viewer.name
