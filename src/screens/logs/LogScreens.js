import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TextInput, Image, SafeAreaView } from 'react-native';

const LogScreens = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchLogs();
  }, [dateRange]); // Refetch when date range changes

  const fetchLogs = async () => {
    try {
      // Generate 24 hours of dummy data
      const generateDummyLogs = () => {
        const logs = [];
        const endDate = new Date(dateRange.endDate);
        const startDate = new Date(dateRange.startDate);
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const hoursToGenerate = daysDiff * 24;
        
        for (let i = 0; i < hoursToGenerate; i++) {
          const date = new Date(endDate);
          date.setHours(date.getHours() - i);
          
          logs.push({
            id: i.toString(),
            timestamp: date.toISOString().slice(0, 19).replace('T', ' '),
            ph: (Math.random() * (8.5 - 6.0) + 6.0).toFixed(1),
            tss: Math.floor(Math.random() * (200 - 100) + 100).toString(),
            nh3n: (Math.random() * (1.0 - 0.1) + 0.1).toFixed(2),
            cod: Math.floor(Math.random() * (150 - 80) + 80).toString(),
            debit: Math.floor(Math.random() * (300 - 200) + 200).toString(),
          });
        }
        return logs;
      };

      const dummyLogs = generateDummyLogs();
      setLogs(dummyLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    // TODO: Implement CSV export functionality
    const csvContent = [
      ['Timestamp', 'pH', 'TSS', 'NH3N', 'COD', 'Debit'],
      ...logs.map(log => [
        log.timestamp,
        log.ph,
        log.tss,
        log.nh3n,
        log.cod,
        log.debit
      ])
    ];
    // Implementation will depend on your export library choice
    console.log('Exporting:', csvContent);
  };

  const renderLogItem = ({ item }) => (
    <View style={styles.logItem}>
      <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.timestamp}</Text>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text>Loading logs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.navbar}>
          <Image 
            source={require('../../assets/logo/logo-eh-2.png')}
            style={styles.navLogo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.filterContainer}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.filterLabel}>Start Date:</Text>
            <TextInput
              style={styles.dateInput}
              value={dateRange.startDate}
              onChangeText={(text) => setDateRange(prev => ({ ...prev, startDate: text }))}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.dateInputContainer}>
            <Text style={styles.filterLabel}>End Date:</Text>
            <TextInput
              style={styles.dateInput}
              value={dateRange.endDate}
              onChangeText={(text) => setDateRange(prev => ({ ...prev, endDate: text }))}
              placeholder="YYYY-MM-DD"
            />
          </View>
          
        </View>

        <View style={styles.tableContainer}>
          {renderTableHeader()}
          <FlatList
            data={logs}
            renderItem={renderLogItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: '#666',
  },
  dateInputContainer: {
    flex: 1.5,
    marginRight: 12,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 6,
    fontSize: 12,
    backgroundColor: '#fff',
  },
  exportButtonContainer: {
    flex: 0.8,
    marginBottom: 1,
    transform: [{ scale: 0.9 }],
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
});

export default LogScreens;
