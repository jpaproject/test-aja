import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/colors';
import io from 'socket.io-client';
import env from '../../config/env';
import RealtimeParamater from "../../components/site-details/RealtimeParamater";
import RealtimeTrend from "../../components/site-details/RealtimeTrend";
import Logs from "../../components/site-details/Logs";

// Add this constant at the top with other constants
const STATUS_DATA = {
    isConnected: true,
    lastNotification: 'System running normally - Last check: 10:45 AM',
};

const SiteDetailScreen = ({ route, navigation }) => {
    const { site } = route.params;
    const [paramValues, setParamValues] = React.useState({});
    const [activeTab, setActiveTab] = React.useState('realtime');
    const [realtimeHistory, setRealtimeHistory] = React.useState({});
    const [socket, setSocket] = React.useState(null);
    const [isConnected, setIsConnected] = React.useState(false);
    // Add new state for storing historical realtime data
    const MAX_HISTORY_POINTS = 24; // Store last 24 data points
    const tokenRef = React.useRef(site.token);

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

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#333"/>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{site.name}</Text>
                <View style={styles.headerRight}/>
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
                    style={[styles.tabButton, activeTab === 'datatrend' && styles.activeTab]}
                    onPress={() => setActiveTab('datatrend')}
                >
                    <Text style={[styles.tabText, activeTab === 'datatrend' && styles.activeTabText]}>Real-time
                        Trend</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'datalogs' && styles.activeTab]}
                    onPress={() => setActiveTab('datalogs')}
                >
                    <Text style={[styles.tabText, activeTab === 'datalogs' && styles.activeTabText]}>Data Logs</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {activeTab === 'realtime' && (
                    <RealtimeParamater isConnected={isConnected} site={site} paramValues={paramValues}/>
                )}

                {activeTab === 'datatrend' && (
                    <RealtimeTrend site={site} realtimeHistory={realtimeHistory}/>
                )}

                {activeTab === 'datalogs' && <Logs token={tokenRef.current}/>}
            </View>
        </SafeAreaView>
    );
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
        textTransform: 'capitalize',
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
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
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
        borderWidth: 1,
        borderColor: '#eee',
    },
    map: {
        flex: 1,
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
});

export default SiteDetailScreen; 