// Azure Container Instances Deployment for AI Study Circle
// Optimized for cost efficiency based on analysis
@description('Location for all resources')
param location string = resourceGroup().location

@description('Environment name (dev, staging, prod)')
param environment string = 'dev'

@description('Application name prefix')
param appName string = 'ai-study-circle'

@description('Container registry login server')
param registryLoginServer string

@description('Container registry username')
param registryUsername string

@description('Container registry password')
@secure()
param registryPassword string

@description('MongoDB connection string')
@secure()
param mongoConnectionString string

@description('Redis connection string')
@secure()
param redisConnectionString string

@description('JWT secret')
@secure()
param jwtSecret string

// Variables
var uniqueSuffix = substring(uniqueString(resourceGroup().id), 0, 8)
var frontendName = '${appName}-frontend-${environment}-${uniqueSuffix}'
var backendName = '${appName}-backend-${environment}-${uniqueSuffix}'
var elkName = '${appName}-elk-${environment}-${uniqueSuffix}'
var vnetName = '${appName}-vnet-${environment}'
var nsgName = '${appName}-nsg-${environment}'

// Virtual Network for secure communication
resource vnet 'Microsoft.Network/virtualNetworks@2023-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: {
      addressPrefixes: ['10.0.0.0/16']
    }
    subnets: [
      {
        name: 'container-subnet'
        properties: {
          addressPrefix: '10.0.1.0/24'
          networkSecurityGroup: {
            id: nsg.id
          }
          delegations: [
            {
              name: 'Microsoft.ContainerInstance/containerGroups'
              properties: {
                serviceName: 'Microsoft.ContainerInstance/containerGroups'
              }
            }
          ]
        }
      }
    ]
  }
}

// Network Security Group
resource nsg 'Microsoft.Network/networkSecurityGroups@2023-05-01' = {
  name: nsgName
  location: location
  properties: {
    securityRules: [
      {
        name: 'AllowHTTP'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '80'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1000
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowHTTPS'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '443'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1001
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowBackendAPI'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '5000'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1002
          direction: 'Inbound'
        }
      }
      {
        name: 'AllowKibana'
        properties: {
          protocol: 'Tcp'
          sourcePortRange: '*'
          destinationPortRange: '5601'
          sourceAddressPrefix: '*'
          destinationAddressPrefix: '*'
          access: 'Allow'
          priority: 1003
          direction: 'Inbound'
        }
      }
    ]
  }
}

// Public IP for Application Gateway
resource publicIp 'Microsoft.Network/publicIPAddresses@2023-05-01' = {
  name: '${appName}-pip-${environment}'
  location: location
  sku: {
    name: 'Standard'
  }
  properties: {
    publicIPAllocationMethod: 'Static'
    dnsSettings: {
      domainNameLabel: '${appName}-${environment}-${uniqueSuffix}'
    }
  }
}

// ELK Stack Container Group
resource elkContainerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: elkName
  location: location
  properties: {
    containers: [
      {
        name: 'elasticsearch'
        properties: {
          image: 'docker.elastic.co/elasticsearch/elasticsearch:8.11.0'
          ports: [
            {
              port: 9200
              protocol: 'TCP'
            }
            {
              port: 9300
              protocol: 'TCP'
            }
          ]
          environmentVariables: [
            {
              name: 'discovery.type'
              value: 'single-node'
            }
            {
              name: 'xpack.security.enabled'
              value: 'false'
            }
            {
              name: 'ES_JAVA_OPTS'
              value: '-Xms512m -Xmx512m'
            }
          ]
          resources: {
            requests: {
              cpu: 1
              memoryInGB: 2
            }
          }
          volumeMounts: [
            {
              name: 'elasticsearch-data'
              mountPath: '/usr/share/elasticsearch/data'
            }
          ]
        }
      }
      {
        name: 'logstash'
        properties: {
          image: 'docker.elastic.co/logstash/logstash:8.11.0'
          ports: [
            {
              port: 5044
              protocol: 'TCP'
            }
          ]
          environmentVariables: [
            {
              name: 'LS_JAVA_OPTS'
              value: '-Xms256m -Xmx256m'
            }
          ]
          resources: {
            requests: {
              cpu: 0.5
              memoryInGB: 1
            }
          }
          volumeMounts: [
            {
              name: 'logstash-config'
              mountPath: '/usr/share/logstash/pipeline'
            }
          ]
        }
      }
      {
        name: 'kibana'
        properties: {
          image: 'docker.elastic.co/kibana/kibana:8.11.0'
          ports: [
            {
              port: 5601
              protocol: 'TCP'
            }
          ]
          environmentVariables: [
            {
              name: 'ELASTICSEARCH_HOSTS'
              value: 'http://localhost:9200'
            }
          ]
          resources: {
            requests: {
              cpu: 0.5
              memoryInGB: 1
            }
          }
        }
      }
    ]
    osType: 'Linux'
    restartPolicy: 'Always'
    ipAddress: {
      type: 'Private'
      ports: [
        {
          port: 9200
          protocol: 'TCP'
        }
        {
          port: 5044
          protocol: 'TCP'
        }
        {
          port: 5601
          protocol: 'TCP'
        }
      ]
    }
    subnetIds: [
      {
        id: vnet.properties.subnets[0].id
      }
    ]
    volumes: [
      {
        name: 'elasticsearch-data'
        emptyDir: {}
      }
      {
        name: 'logstash-config'
        configMap: {
          items: [
            {
              key: 'logstash.conf'
              path: 'logstash.conf'
            }
          ]
        }
      }
    ]
  }
}

// Backend Container Group
resource backendContainerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: backendName
  location: location
  properties: {
    containers: [
      {
        name: 'backend'
        properties: {
          image: '${registryLoginServer}/ai-study-circle-backend:latest'
          ports: [
            {
              port: 5000
              protocol: 'TCP'
            }
          ]
          environmentVariables: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '5000'
            }
            {
              name: 'MONGODB_URI'
              secureValue: mongoConnectionString
            }
            {
              name: 'REDIS_URL'
              secureValue: redisConnectionString
            }
            {
              name: 'JWT_SECRET'
              secureValue: jwtSecret
            }
            {
              name: 'ELASTICSEARCH_URL'
              value: 'http://${elkContainerGroup.properties.ipAddress.ip}:9200'
            }
            {
              name: 'LOGSTASH_HOST'
              value: '${elkContainerGroup.properties.ipAddress.ip}'
            }
            {
              name: 'LOGSTASH_PORT'
              value: '5044'
            }
          ]
          resources: {
            requests: {
              cpu: 2
              memoryInGB: 4
            }
          }
        }
      }
    ]
    imageRegistryCredentials: [
      {
        server: registryLoginServer
        username: registryUsername
        password: registryPassword
      }
    ]
    osType: 'Linux'
    restartPolicy: 'Always'
    ipAddress: {
      type: 'Private'
      ports: [
        {
          port: 5000
          protocol: 'TCP'
        }
      ]
    }
    subnetIds: [
      {
        id: vnet.properties.subnets[0].id
      }
    ]
  }
  dependsOn: [
    elkContainerGroup
  ]
}

// Frontend Container Group
resource frontendContainerGroup 'Microsoft.ContainerInstance/containerGroups@2023-05-01' = {
  name: frontendName
  location: location
  properties: {
    containers: [
      {
        name: 'frontend'
        properties: {
          image: '${registryLoginServer}/ai-study-circle-frontend:latest'
          ports: [
            {
              port: 3000
              protocol: 'TCP'
            }
          ]
          environmentVariables: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'NEXT_PUBLIC_API_URL'
              value: 'https://${publicIp.properties.dnsSettings.fqdn}/api'
            }
          ]
          resources: {
            requests: {
              cpu: 1.5
              memoryInGB: 3
            }
          }
        }
      }
    ]
    imageRegistryCredentials: [
      {
        server: registryLoginServer
        username: registryUsername
        password: registryPassword
      }
    ]
    osType: 'Linux'
    restartPolicy: 'Always'
    ipAddress: {
      type: 'Private'
      ports: [
        {
          port: 3000
          protocol: 'TCP'
        }
      ]
    }
    subnetIds: [
      {
        id: vnet.properties.subnets[0].id
      }
    ]
  }
  dependsOn: [
    backendContainerGroup
  ]
}

// Application Gateway for load balancing and SSL termination
resource applicationGateway 'Microsoft.Network/applicationGateways@2023-05-01' = {
  name: '${appName}-agw-${environment}'
  location: location
  properties: {
    sku: {
      name: 'Standard_v2'
      tier: 'Standard_v2'
      capacity: 1
    }
    gatewayIPConfigurations: [
      {
        name: 'appGatewayIpConfig'
        properties: {
          subnet: {
            id: resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, 'container-subnet')
          }
        }
      }
    ]
    frontendIPConfigurations: [
      {
        name: 'appGatewayFrontendIP'
        properties: {
          publicIPAddress: {
            id: publicIp.id
          }
        }
      }
    ]
    frontendPorts: [
      {
        name: 'port_80'
        properties: {
          port: 80
        }
      }
      {
        name: 'port_443'
        properties: {
          port: 443
        }
      }
    ]
    backendAddressPools: [
      {
        name: 'frontend-pool'
        properties: {
          backendAddresses: [
            {
              ipAddress: frontendContainerGroup.properties.ipAddress.ip
            }
          ]
        }
      }
      {
        name: 'backend-pool'
        properties: {
          backendAddresses: [
            {
              ipAddress: backendContainerGroup.properties.ipAddress.ip
            }
          ]
        }
      }
    ]
    backendHttpSettingsCollection: [
      {
        name: 'frontend-settings'
        properties: {
          port: 3000
          protocol: 'Http'
          cookieBasedAffinity: 'Disabled'
        }
      }
      {
        name: 'backend-settings'
        properties: {
          port: 5000
          protocol: 'Http'
          cookieBasedAffinity: 'Disabled'
        }
      }
    ]
    httpListeners: [
      {
        name: 'frontend-listener'
        properties: {
          frontendIPConfiguration: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendIPConfigurations', '${appName}-agw-${environment}', 'appGatewayFrontendIP')
          }
          frontendPort: {
            id: resourceId('Microsoft.Network/applicationGateways/frontendPorts', '${appName}-agw-${environment}', 'port_80')
          }
          protocol: 'Http'
        }
      }
    ]
    requestRoutingRules: [
      {
        name: 'frontend-rule'
        properties: {
          ruleType: 'Basic'
          priority: 1000
          httpListener: {
            id: resourceId('Microsoft.Network/applicationGateways/httpListeners', '${appName}-agw-${environment}', 'frontend-listener')
          }
          backendAddressPool: {
            id: resourceId('Microsoft.Network/applicationGateways/backendAddressPools', '${appName}-agw-${environment}', 'frontend-pool')
          }
          backendHttpSettings: {
            id: resourceId('Microsoft.Network/applicationGateways/backendHttpSettingsCollection', '${appName}-agw-${environment}', 'frontend-settings')
          }
        }
      }
    ]
  }
  dependsOn: [
    vnet
    publicIp
    frontendContainerGroup
    backendContainerGroup
  ]
}

// Outputs
output frontendUrl string = 'http://${publicIp.properties.dnsSettings.fqdn}'
output backendUrl string = 'http://${publicIp.properties.dnsSettings.fqdn}/api'
output kibanaUrl string = 'http://${publicIp.properties.dnsSettings.fqdn}:5601'
output publicIpAddress string = publicIp.properties.ipAddress
output resourceGroupName string = resourceGroup().name