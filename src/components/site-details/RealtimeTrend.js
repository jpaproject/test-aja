import React from 'react'
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Colors } from "../../constants/colors";

const RealtimeTrend = ({ site, realtimeHistory }) => {
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

    return (
        <ScrollView style={styles.dataTrendContainer}>
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
                            yAxisTextStyle={{ color: '#000', fontSize: 10 }}
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
                                            <Text
                                                style={styles.tooltipText}>{`${param.name}: ${item.value} ${param.unit}`}</Text>
                                        </View>
                                    );
                                },
                            }}
                        />
                    </View>
                </View>
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    dataTrendContainer: {
        padding: 16,
    },
    tableCard: {
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
    tableTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    chartContainer: {
        marginBottom: 16,
        alignItems: 'center',
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
})
export default RealtimeTrend
