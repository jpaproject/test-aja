import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import { LineChart } from 'react-native-gifted-charts';
import io from 'socket.io-client';
import env from '../../config/env';

const data=[ {value:50}, {value:80}, {value:90}, {value:70} ]

// Add this constant at the top with other constants
const STATUS_DATA = {
  isConnected: true,
  lastNotification: 'System running normally - Last check: 10:45 AM',
};

const SiteDetailScreen = ({ route, navigation }) => {
  const { site } = route.params;
  const [paramValues, setParamValues] = React.useState({});
  const [activeTab, setActiveTab] = React.useState('realtime');
  const [socket, setSocket] = React.useState(null);
  const [isConnected, setIsConnected] = React.useState(false);

  // Update historical data state with 24-hour labels
  const [historicalData, setHistoricalData] = React.useState({
    labels: Array.from({length: 24}, (_, i) => `${i}:00`),
    datasets: {}
  });

  // Add new state for storing historical realtime data
  const [realtimeHistory, setRealtimeHistory] = React.useState({});
  const MAX_HISTORY_POINTS = 24; // Store last 24 data points

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
      if (!data || !data.token || data.token !== site.token) return;

      // Update current parameter values
      setParamValues(prevValues => ({
        ...prevValues,
        [`${site.token}-pH`]: data.ph || data.pH,
        [`${site.token}-TSS`]: data.tss || data.TSS,
        [`${site.token}-NH3N`]: data.nh3n || data.NH3N,
        [`${site.token}-COD`]: data.cod || data.COD,
        [`${site.token}-Debit`]: data.debit || data.Debit
      }));

      // Update historical data
      const timestamp = new Date().toLocaleTimeString();
      setRealtimeHistory(prev => {
        const newHistory = { ...prev };
        site.parameters.forEach(param => {
          // Create a mapping for different possible key cases
          const paramKeys = {
            'pH': ['ph', 'pH'],
            'TSS': ['tss', 'TSS'],
            'NH3N': ['nh3n', 'NH3N'],
            'COD': ['cod', 'COD'],
            'Debit': ['debit', 'Debit']
          };

          // Get possible keys for this parameter
          const possibleKeys = paramKeys[param.name] || [param.name.toLowerCase()];
          
          // Find the first key that has data
          const value = possibleKeys.reduce((val, key) => val ?? data[key], null);

          if (value !== undefined && value !== null) {
            const numericValue = Number(value);
            if (!isNaN(numericValue)) {
              const paramHistory = [...(prev[param.name] || [])];
              paramHistory.push({
                value: numericValue,
                dataPointText: numericValue.toFixed(2),
                label: timestamp
              });
              // Keep only last MAX_HISTORY_POINTS
              if (paramHistory.length > MAX_HISTORY_POINTS) {
                paramHistory.shift();
              }
              newHistory[param.name] = paramHistory;
            }
          }
        });
        return newHistory;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [site.token]);

  const renderRealtimeView = () => (
    <ScrollView style={styles.parametersContainer}>
      <View style={styles.statusCard}>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View style={[
            styles.connectionStatus, 
            { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
          ]}>
            <Text style={styles.connectionText}>
              {isConnected ? 'WSS Online' : 'WSS Offline'}
            </Text>
          </View>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusLabel}>Last Notification:</Text>
          <Text style={styles.notificationText}>
            {isConnected ? 
              'System running normally' : 
              'Waiting for connection...'}
          </Text>
        </View>
      </View>

      <View style={styles.parameterCards}>
        {site.parameters.map((param, index) => (
          <View key={index} style={styles.parameterCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Icon name={param.icon} size={20} color={Colors.magenta2} />
              </View>
              <Text style={styles.parameterName}>{param.name}</Text>
            </View>
            <View style={styles.valueContainer}>
              <Text style={styles.parameterValue}>
                {Number(paramValues[`${site.token}-${param.name}`] || '0').toFixed(2)}
              </Text>
              <Text style={styles.parameterUnit}>{param.unit}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // Update data generator for 24-hour data points
  const generateDummyChartData = (paramName) => {
    return Array.from({length: 24}).map((_, i) => {
      const value = generateRealistic24HourValue(paramName, i);
      return {
        value: Number(value.toFixed(2)),
        dataPointText: value.toFixed(2),
        label: `${i}:00`
      };
    });
  };

  // New helper function for realistic 24-hour data
  const generateRealistic24HourValue = (paramName, hour) => {
    // Add some variation based on time of day
    const timeMultiplier = Math.sin((hour / 24) * Math.PI * 2);
    
    switch (paramName) {
      case 'pH':
        // pH varies between 6.5 and 8.5 with slight daily pattern
        return 7.5 + (timeMultiplier * 0.5);
      case 'TSS':
        // TSS higher during peak hours (morning/evening)
        const peakHours = Math.sin((hour - 8) / 24 * Math.PI * 4); // Two peaks at 8am and 8pm
        return 100 + (peakHours * 50);
      case 'NH3N':
        // NH3N peaks during afternoon
        return 25 + (timeMultiplier * 10);
      case 'COD':
        // COD higher during business hours
        const businessHours = (hour >= 8 && hour <= 18) ? 1.5 : 1;
        return (200 + (timeMultiplier * 50)) * businessHours;
      case 'Debit':
        // Debit follows daily water usage pattern
        const usage = Math.sin((hour - 6) / 24 * Math.PI * 2); // Peak at noon
        return 5 + (usage * 2);
      default:
        return 0;
    }
  };

  // Update compact data generator untuk menghasilkan data yang lebih konsisten
  const generateCompactChartData = (paramName) => {
    return Array.from({length: 6}).map((_, i) => { // Reduced to 6 points
      let value;
      switch (paramName) {
        case 'pH':
          value = 7 + Math.sin(i/2) * 1; // Oscillates around 7 (6-8)
          break;
        case 'TSS':
          value = 50 + Math.cos(i/3) * 20; // Oscillates around 50 (30-70)
          break;
        case 'NH3N':
          value = 30 + Math.sin(i/4) * 10; // Oscillates around 30 (20-40)
          break;
        case 'COD':
          value = 40 + Math.sin(i/2) * 15; // Oscillates around 40 (25-55)
          break;
        case 'Debit':
          value = 60 + Math.cos(i/3) * 20; // Oscillates around 60 (40-80)
          break;
        default:
          value = 0;
      }
      return {
        value: Number(value.toFixed(1)),
        dataPointText: value.toFixed(1),
        label: `${i*2}h`
      };
    });
  };

  const renderDataLogsView = () => (
    <ScrollView style={styles.dataLogsContainer}>
      {site.parameters.map((param, index) => (
        <View key={index} style={styles.tableCard}>
          <Text style={styles.tableTitle}>{param.name}</Text>
          
          <View style={styles.chartContainer}>
            <LineChart
              data={realtimeHistory[param.name] || []}
              width={300}
              height={150}
              spacing={12}
              color={getParameterColor(param.name)}
              thickness={2}
              startFillColor={getParameterColor(param.name)}
              endFillColor={'#fff'}
              initialSpacing={0}
              endSpacing={0}
              showVerticalLines
              verticalLinesColor={'rgba(14,164,164,0.1)'}
              xAxisColor={'#000'}
              yAxisColor={'#000'}
              yAxisTextStyle={{color: '#000', fontSize: 10}}
              hideDataPoints={true}
              curved={true}
              areaChart={true}
              textColor="#000"
              hideRules={true}
              textShiftY={0}
              textShiftX={0}
              opacity={0.3}
              showDataPointOnPress={true}
              pressEnabled={true}
              pointerConfig={{
                pointerColor: getParameterColor(param.name),
                pointerStripHeight: 140,
                pointerStripColor: 'rgba(0,0,0,0.1)',
                pointerStripWidth: 2,
                pointerLabelWidth: 100,
                pointerLabelHeight: 40,
                activatePointersOnLongPress: false,
                autoAdjustPointerLabelPosition: true,
                pointerLabelComponent: (items) => {
                  const item = items[0];
                  return (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText}>{`Time: ${item.label}`}</Text>
                      <Text style={styles.tooltipText}>{`${param.name}: ${item.value} ${param.unit}`}</Text>
                    </View>
                  );
                },
              }}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{site.name}</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Updated Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'realtime' && styles.activeTab]}
          onPress={() => setActiveTab('realtime')}
        >
          <Text style={[styles.tabText, activeTab === 'realtime' && styles.activeTabText]}>Real-time</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'datalogs' && styles.activeTab]}
          onPress={() => setActiveTab('datalogs')}
        >
          <Text style={[styles.tabText, activeTab === 'datalogs' && styles.activeTabText]}>Real-time Trend</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'realtime' ? renderRealtimeView() : renderDataLogsView()}
      </ScrollView>
    </SafeAreaView>
  );
};

// Reuse the helper function from HomeScreen
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

// Add color helper function
const getParameterColor = (paramName) => {
  const colors = {
    'pH': '#FF6B6B',
    'TSS': '#4ECDC4',
    'NH3N': '#45B7D1',
    'COD': '#96CEB4',
    'Debit': '#FFEEAD',
  };
  return colors[paramName] || Colors.magenta2;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 0,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
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
  parametersContainer: {
    padding: 16,
  },
  parameterCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  parameterCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    backgroundColor: Colors.magenta2 + '15',
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  parameterName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-start',
  },
  parameterValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.magenta2,
    marginRight: 4,
  },
  parameterUnit: {
    fontSize: 12,
    color: '#666',
  },
  mapContainer: {
    margin: 16,
    height: 400,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  map: {
    flex: 1,
  },
  dataLogsContainer: {
    padding: 16,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  table: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.magenta2 + '15',
    padding: 12,
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 12,
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    color: '#666',
  },
  chartContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  connectionStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  notificationText: {
    color: '#666',
    fontSize: 12,
    flex: 1,
  },
  multiChartCard: undefined,
  chartTitle: undefined,
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  tooltip: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 8,
    position: 'absolute',
  },
  tooltipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginVertical: 2,
  },
});

export default SiteDetailScreen; 