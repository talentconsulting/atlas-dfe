// Hosts the catalogue viewer on Azure Container Apps, behind the viewer's username and password login.
//
// Deploys into an existing resource group: a private container registry, a managed identity the app pulls
// its image with, a Log Analytics workspace, a Container Apps environment and the viewer app. The password is
// a Container App secret, passed to the viewer as AUTH_PASSWORD. HOSTING.md describes the one-time setup.
targetScope = 'resourceGroup'

@description('Region for every resource.')
param location string = resourceGroup().location

@description('Prefix for resource names, for example atlas-dfe-viewer.')
param namePrefix string

@description('Container registry name. Globally unique, 5-50 letters and digits.')
param registryName string

@description('Image to run, as <registry>.azurecr.io/<repository>:<tag>. Leave empty on the first deployment, before an image has been pushed: a placeholder runs until the deploy workflow replaces it.')
param image string = ''

@description('Username for the viewer\'s login.')
param authUsername string = 'admin'

@secure()
@minLength(20)
@description('Password for the viewer\'s login. The viewer doesn\'t lock out repeated failures, so use a long random one.')
param authPassword string

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
      secrets: [
        { name: 'auth-password', value: authPassword }
      ]
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
            { name: 'AUTH_USERNAME', value: authUsername }
            { name: 'AUTH_PASSWORD', secretRef: 'auth-password' }
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

@description('The viewer\'s address.')
output url string = 'https://${viewer.properties.configuration.ingress.fqdn}'

output registryLoginServer string = registry.properties.loginServer
output containerAppName string = viewer.name
