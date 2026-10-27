// The proof of concept in Talent Consulting's Development subscription. Copy this file for another host.
using 'viewer.bicep'

param namePrefix = 'atlas-dfe-viewer'
param registryName = 'atlasdfeviewerpoc'
param image = readEnvironmentVariable('VIEWER_IMAGE', '')
param authPassword = readEnvironmentVariable('VIEWER_AUTH_PASSWORD')
param catalogueRepositoryUrl = 'https://github.com/talentconsulting/atlas-dfe'
param tags = {
  Owner: 'rgparkins'
  Purpose: 'atlas-viewer-poc'
}
