import React, { useEffect, useState } from "react";
import {
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    TouchableOpacity
} from "react-native";
import DatePicker from "react-native-date-picker";
import { getMonitoringData } from "../../services/api";

const Logs = ({ token }) => {
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState(null);

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [startDate, setStartDate] = useState(startOfDay);
    const [endDate, setEndDate] = useState(endOfDay);

    const [openStartPicker, setOpenStartPicker] = useState(false);
    const [openEndPicker, setOpenEndPicker] = useState(false);

    useEffect(() => {
        handleLogs();
    }, []);

    /**
     * Formats a JavaScript Date object into a string representation.
     *
     * @param {Date} date - The date object to format.
     * @param {string|null} mode - Optional mode parameter.
     *        If mode is `"view"`, the function returns only `YYYY-MM-DD`.
     *        Otherwise, it returns the full datetime in `YYYY-MM-DD HH:mm:ss` format.
     *
     * @returns {string} Formatted date string based on the provided mode.
     */
    const formatDateTime = (date, mode = null) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        if (mode === "view") {
            return `${year}-${month}-${day}`;
        }

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const handleLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getMonitoringData(
                formatDateTime(startDate),
                formatDateTime(endDate),
                token
            );

            if (response.success) {
                setLogs(response.data);
            } else {
                throw new Error(response.message || "Failed to fetch data");
            }
        } catch (e) {
            console.error("Error fetching logs:", e.message);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Fungsi untuk menghandle perubahan tanggal dari input filter
    const handleStartDateChange = (date) => {
        setOpenStartPicker(false);

        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);

        setStartDate(newDate);
    };

    const handleEndDateChange = (date) => {
        setOpenEndPicker(false);

        const newDate = new Date(date);
        newDate.setHours(23, 59, 59, 999);

        setEndDate(newDate);
    };

    // Fungsi untuk menghandle filter submit
    const handleFilterSubmit = () => {
        handleLogs();
    };

    const renderLogItem = ({ item }) => (
        <View style={styles.logItem}>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.datetime_client_formated}</Text>
            <Text style={[styles.tableCell, { flex: 0.7 }]}>{item.ph}</Text>
            <Text style={[styles.tableCell, { flex: 0.7 }]}>{item.tss}</Text>
            <Text style={[styles.tableCell, { flex: 0.7 }]}>{item.nh3n}</Text>
            <Text style={[styles.tableCell, { flex: 0.7 }]}>{item.cod}</Text>
            <Text style={[styles.tableCell, { flex: 0.7 }]}>{item.debit}</Text>
        </View>
    );

    const renderTableHeader = () => (
        <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Timestamp</Text>
            <Text style={[styles.headerCell, { flex: 0.7 }]}>pH</Text>
            <Text style={[styles.headerCell, { flex: 0.7 }]}>TSS</Text>
            <Text style={[styles.headerCell, { flex: 0.7 }]}>NH3N</Text>
            <Text style={[styles.headerCell, { flex: 0.7 }]}>COD</Text>
            <Text style={[styles.headerCell, { flex: 0.7 }]}>Debit</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                {/* Input Date Picker */}
                <View style={styles.datePickerContainer}>
                    <TouchableOpacity onPress={() => setOpenStartPicker(true)} style={styles.dateButton}>
                        <Text>Start Date: {formatDateTime(startDate, "view")}</Text>
                    </TouchableOpacity>
                    <DatePicker
                        modal
                        open={openStartPicker}
                        date={startDate}
                        mode="date"
                        onConfirm={(date) => {
                            handleStartDateChange(date)
                        }}
                        onCancel={() => setOpenStartPicker(false)}
                    />

                    <TouchableOpacity onPress={() => setOpenEndPicker(true)} style={styles.dateButton}>
                        <Text>End Date: {formatDateTime(endDate, "view")}</Text>
                    </TouchableOpacity>
                    <DatePicker
                        modal
                        open={openEndPicker}
                        date={endDate}
                        mode="date"
                        onConfirm={(date) => {
                            handleEndDateChange(date)
                        }}
                        onCancel={() => setOpenEndPicker(false)}
                    />
                </View>

                {/* Button Filter */}
                <TouchableOpacity onPress={handleFilterSubmit} style={styles.fetchButton}>
                    <Text style={styles.fetchButtonText}>Filter</Text>
                </TouchableOpacity>

                {
                    loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#3498db"/>
                            <Text style={styles.loadingText}>Loading logs...</Text>
                        </View>
                    ) : error ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>Error: {error}</Text>
                        </View>
                    ) : (
                        <View style={styles.tableContainer}>
                            {renderTableHeader()}
                            <FlatList
                                data={logs}
                                renderItem={renderLogItem}
                                keyExtractor={(item) => item.id.toString()}
                                style={styles.list}
                            />
                        </View>
                    )
                }
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    list: {
        flex: 1,
    },
    datePickerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 10,
        marginVertical: 20,
    },
    dateButton: {
        padding: 10,
        backgroundColor: "#ddd",
        borderRadius: 5,
    },
    fetchButton: {
        padding: 10,
        backgroundColor: "#007bff",
        borderRadius: 5,
        alignItems: "center",
        marginBottom: 20,
        marginHorizontal: 10,
    },
    fetchButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    tableContainer: {
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#ddd',
        flex: 1,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        alignItems: 'center',
    },
    headerCell: {
        fontWeight: 'bold',
        fontSize: 12,
        paddingHorizontal: 4,
        textAlign: 'center',
    },
    tableCell: {
        fontSize: 12,
        paddingHorizontal: 4,
        textAlign: 'center',
    },
    logItem: {
        flexDirection: 'row',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#3498db",
    },
    errorContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    errorText: {
        color: "red",
        fontSize: 16,
        textAlign: "center",
    }
});

export default Logs
