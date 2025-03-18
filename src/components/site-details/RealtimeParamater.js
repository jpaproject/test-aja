import React from 'react'
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from "../../constants/colors";

const RealtimeParamater = ({ isConnected, site, paramValues }) => {
    return (
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
                                <Icon name={param.icon} size={20} color={Colors.magenta2}/>
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
    )
}

const styles = StyleSheet.create({
    parametersContainer: {
        padding: 16,
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 10,
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
    parameterCards: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    parameterCard: {
        width: '47%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 8,
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
})
export default RealtimeParamater
