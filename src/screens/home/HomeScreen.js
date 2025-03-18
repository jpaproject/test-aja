import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Dimensions, RefreshControl, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { WebView } from 'react-native-webview';
import { getSitesByCompanyId } from '../../services/api';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import io from 'socket.io-client';
import env from '../../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
const HomeScreen = ({ navigation }) => {
  const [sites, setSites] = React.useState([]);
  const [paramValues, setParamValues] = React.useState({});
  const [activeTab, setActiveTab] = React.useState('grid');
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [socket, setSocket] = React.useState(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [company, setCompany] = React.useState(null);
  const webViewRef = React.useRef(null);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchSites().finally(() => setRefreshing(false));
  }, []);

  // Move fetchSites function outside useEffect for reusability
  const fetchSites = async () => {
    if (!user?.company_id) return; // Add guard clause
    
    try {
      const response = await getSitesByCompanyId(user.company_id);
      if (response.status === 'success') {
        const formattedSites = response.data.map(site => ({
          id: site.id,
          name: site.site_name,
          address: site.site_address,
          phone: site.site_phone,
          email: site.site_email,
          longitude: parseFloat(site.site_longitude),
          latitude: parseFloat(site.site_latitude),
          visibility: site.site_visibility,
          token: site.site_token,
          parameters: [
            { name: 'pH', unit: 'pH', icon: 'water' },
            { name: 'TSS', unit: 'mg/L', icon: 'blur-on' },
            { name: 'NH3N', unit: 'mg/L', icon: 'science' },
            { name: 'COD', unit: 'mg/L', icon: 'opacity' },
            { name: 'Debit', unit: 'm³/s', icon: 'speed' },
          ]
        }));
        setSites(formattedSites);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Modify getUser function to also set company data
  const getUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('@user');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Set company data if it exists in the user object
        if (parsedUser.company) {
          setCompany(parsedUser.company);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Modify the existing useEffect to fetch sites after user is loaded
  React.useEffect(() => {
    getUser();
  }, []);

  // Add new useEffect to fetch sites when user changes
  React.useEffect(() => {
    if (user) {
      fetchSites();
    }
  }, [user]);

  // Initialize Socket.IO connection
  React.useEffect(() => {
    const newSocket = io(env.WS_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('realtime_values', (message) => {
      const { topic, data } = message;
      if (!data || !data.token) return;

      // Update parameter values state
      setParamValues(prevValues => ({
        ...prevValues,
        [`${data.token}-pH`]: data.pH,
        [`${data.token}-TSS`]: data.tss,
        [`${data.token}-NH3N`]: data.nh3n,
        [`${data.token}-COD`]: data.cod,
        [`${data.token}-Debit`]: data.debit
      }));

      // Update map markers using webViewRef
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`
          updateMarkerValues('${data.token}', {
            pH: ${data.pH},
            tss: ${data.tss},
            nh3n: ${data.nh3n},
            cod: ${data.cod},
            debit: ${data.debit}
          });
          true;
        `);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const renderGridView = () => (
    <View style={styles.parametersContainer}>
      <View style={styles.siteHeaderContainer}>
        <Text style={styles.sectionTitle}>Sites</Text>
        <View style={[
          styles.connectionStatus, 
          isConnected ? styles.connected : styles.disconnected
        ]}>
          <Text style={styles.connectionText}>
            {isConnected ? 'WSS Online' : 'WSS Offline'}
          </Text>
        </View>
      </View>
      <View style={styles.sitesContainer}>
        {sites.map((site, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.siteCard}
            onPress={() => navigation.navigate('SiteDetail', { site })}
          >
            <Text style={styles.siteName}>{site.name}</Text>
            <View style={styles.parameterGrid}>
              {site.parameters.map((param, paramIndex) => (
                <View 
                  key={paramIndex}
                  style={styles.parameterCard}
                >
                  <Text style={styles.parameterName}>{param.name}</Text>
                  <Text style={styles.parameterValue}>
                    {Number(paramValues[`${site.token}-${param.name}`] || '0').toFixed(2)}
                  </Text>
                  <Text style={styles.parameterUnit}>{param.unit}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMapView = () => (
    <View style={[
      styles.mapContainer,
      isFullscreen && styles.mapContainerFullscreen
    ]}>
      <WebView
        ref={webViewRef}
        source={{
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                <style>
                  html, body { 
                    margin: 0; 
                    padding: 0;
                    width: 100%;
                    height: 100%;
                  }
                  #map { 
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                  }
                  .custom-popup {
                    font-size: 13px;
                  }
                  .param-value {
                    font-weight: bold;
                    color: #007AFF;
                  }
                  .leaflet-popup-content {
                    margin: 8px;
                    min-width: 200px;
                  }
                  .param-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 2px 0;
                  }
                  .param-label {
                    color: #666;
                  }
                  .param-value {
                    font-weight: bold;
                    color: #007AFF;
                  }
                </style>
              </head>
              <body>
                <div id="map"></div>
                <script>
                  const map = L.map('map').setView([-6.2088, 106.8456], 13);
                  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                  }).addTo(map);
                  
                  const markers = {};
                  const popupContents = {};
                  
                  ${sites.map((site) => `
                    // Create popup content for each site
                    popupContents['${site.token}'] = {
                      pH: '0.00',
                      TSS: '0.00',
                      NH3N: '0.00',
                      COD: '0.00',
                      Debit: '0.00'
                    };

                    // Function to generate popup HTML
                    function generatePopupContent(token) {
                      return '<div class="custom-popup">' +
                        '<strong>${site.name}</strong><br/>' +
                        '<div class="param-row"><span class="param-label">pH:</span> <span class="param-value">' + popupContents[token].pH + '</span></div>' +
                        '<div class="param-row"><span class="param-label">TSS:</span> <span class="param-value">' + popupContents[token].TSS + ' mg/L</span></div>' +
                        '<div class="param-row"><span class="param-label">NH3N:</span> <span class="param-value">' + popupContents[token].NH3N + ' mg/L</span></div>' +
                        '<div class="param-row"><span class="param-label">COD:</span> <span class="param-value">' + popupContents[token].COD + ' mg/L</span></div>' +
                        '<div class="param-row"><span class="param-label">Debit:</span> <span class="param-value">' + popupContents[token].Debit + ' m³/s</span></div>' +
                        '</div>';
                    }

                    // Create marker with initial popup content
                    markers['${site.token}'] = L.marker([${site.latitude}, ${site.longitude}])
                      .bindPopup(generatePopupContent('${site.token}'))
                      .addTo(map);
                  `).join('')}

                  // Function to update marker values
                  window.updateMarkerValues = function(token, data) {
                    if (!markers[token] || !popupContents[token]) return;
                    
                    // Update stored values
                    popupContents[token] = {
                      pH: Number(data.pH).toFixed(2),
                      TSS: Number(data.tss).toFixed(2),
                      NH3N: Number(data.nh3n).toFixed(2),
                      COD: Number(data.cod).toFixed(2),
                      Debit: Number(data.debit).toFixed(2)
                    };

                    // Update popup content
                    const popup = markers[token].getPopup();
                    popup.setContent(generatePopupContent(token));
                    
                    // If popup is open, update it
                    if (markers[token].isPopupOpen()) {
                      popup.update();
                    }
                  };

                  // Make map globally accessible
                  window.map = map;
                </script>
              </body>
            </html>
          `
        }}
        style={[styles.map, isFullscreen && styles.mapFullscreen]}
        onMessage={(event) => console.log(event.nativeEvent.data)}
      />
      <TouchableOpacity 
        style={styles.fullscreenButton}
        onPress={() => setIsFullscreen(!isFullscreen)}
      >
        <Icon 
          name={isFullscreen ? "fullscreen-exit" : "fullscreen"} 
          size={24} 
          color="#333"
        />
      </TouchableOpacity>
    </View>
  );

  // Add skeleton loading component
  const renderSkeletonLoading = () => (
    <View style={styles.parametersContainer}>
      <SkeletonPlaceholder>
        <View style={{ marginBottom: 16 }}>
          <View style={{ width: 100, height: 20, borderRadius: 4 }} />
        </View>
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={[styles.siteCard, { marginBottom: 12 }]}>
            <View style={{ width: 120, height: 16, borderRadius: 4, marginBottom: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5].map((_, paramIndex) => (
                <View key={paramIndex} style={{ width: '18%', alignItems: 'center' }}>
                  <View style={{ width: 30, height: 12, borderRadius: 4, marginBottom: 4 }} />
                  <View style={{ width: 40, height: 16, borderRadius: 4, marginBottom: 4 }} />
                  <View style={{ width: 20, height: 10, borderRadius: 4 }} />
                </View>
              ))}
            </View>
          </View>
        ))}
      </SkeletonPlaceholder>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Bar */}
      <View style={styles.navbar}>
        <Image 
          source={require('../../assets/logo/logo-eh-2.png')}
          style={styles.navLogo}
          resizeMode="contain"
        />
        {/* <TouchableOpacity style={styles.menuButton}>
          <Icon name="menu" size={24} color="#333" />
        </TouchableOpacity> */}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.magenta2]}
          />
        }
      >
        {/* Company Information */}
        <View style={styles.companyCard}>
          <View style={styles.companyLogoContainer}>
            <Image 
              source={company?.company_logo ? 
                { uri: `${env.WEB_URL}/storage/${company.company_logo}` } :
                require('../../assets/logo/8W5UNXzHXon7tP25QZIa9bnWzCAg0PyHW9SObSKz.png')
              }
              style={styles.companyLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {company?.company_name || '-'}
            </Text>
            <Text style={styles.companyTagline}>
              {user?.name || 'Smart Water Quality Monitoring'}
            </Text>
          </View>
        </View>

        {/* Tab Buttons */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'grid' && styles.activeTab]}
            onPress={() => setActiveTab('grid')}
          >
            <Text style={[styles.tabText, activeTab === 'grid' && styles.activeTabText]}>Grid View</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'map' && styles.activeTab]}
            onPress={() => setActiveTab('map')}
          >
            <Text style={[styles.tabText, activeTab === 'map' && styles.activeTabText]}>Map View</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'grid' 
          ? (isLoading ? renderSkeletonLoading() : renderGridView())
          : renderMapView()
        }
      </ScrollView>
    </SafeAreaView>
  );
};

// Add helper function for random values
const generateRandomValue = (paramName) => {
  switch (paramName) {
    case 'pH':
      return (Math.random() * (14 - 0) + 0).toFixed(1);
    case 'TSS':
      return Math.floor(Math.random() * 1000);
    case 'NH3N':
      return (Math.random() * 100).toFixed(2);
    case 'COD':
      return Math.floor(Math.random() * 500);
    case 'Debit':
      return (Math.random() * 10).toFixed(2);
    default:
      return '0';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navLogo: {
    width: 120,
    height: 40,
  },
  menuButton: {
    padding: 8,
  },
  companyCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 13,
    padding: 0,
    borderRadius: 10,
    // elevation: 3,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.1,
    // shadowRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyLogoContainer: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  companyLogo: {
    width: 40,
    height: 40,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.magenta2,
    textAlign: 'left',
    marginBottom: 2,
  },
  companyTagline: {
    fontSize: 13,
    color: '#666',
    textAlign: 'left',
  },
  companyDescription: {
    fontSize: 14,
    color: '#777',
    textAlign: 'left',
    lineHeight: 20,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f8f8',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subText: {
    fontSize: 18,
    color: '#666',
  },
  parametersContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  sitesContainer: {
    gap: 2,
  },
  siteCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  siteName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  parameterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
  },
  parameterCard: {
    width: '18%',
    alignItems: 'center',
    marginBottom: 4,
  },
  parameterName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  parameterValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
    marginTop: 2,
  },
  parameterUnit: {
    fontSize: 10,
    color: '#666',
    marginTop: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.magenta2,
  },
  mapContainer: {
    margin: 16,
    height: 400,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapContainerFullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  mapFullscreen: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  fullscreenButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  siteHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectionStatus: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connected: {
    backgroundColor: '#e6ffe6',
  },
  disconnected: {
    backgroundColor: '#ffe6e6',
  },
  connectionText: {
    fontSize: 12,
    color: '#333',
  },
});

export default HomeScreen;

