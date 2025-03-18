import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  Image,
  ScrollView,
} from 'react-native';
import CustomButton from '../../components/common/Button';
import {Colors} from '../../constants/colors';
import MenuItem from '../../components/home/MenuItem';

const HomeScreen = ({navigation}) => {
  const menuItems = [
    {
      title: 'View Sites',
      icon: 'map-marker-multiple',
      onPress: () => {},
    },
    {
      title: 'Reports',
      icon: 'file-chart',
      onPress: () => {},
    },
    {
      title: 'Settings',
      icon: 'cog',
      onPress: () => {},
    },
  ];

  const handleLogout = async () => {
    // Add logout logic here
    // await authService.logout();
    navigation.replace('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require('../../assets/logo/logo-eh-2.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Site Monitoring</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome to Site Monitoring</Text>
          <Text style={styles.descriptionText}>
            Monitor and manage your sites efficiently
          </Text>

          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <MenuItem
                key={index}
                title={item.title}
                icon={item.icon}
                onPress={item.onPress}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <CustomButton
            title="Logout"
            onPress={handleLogout}
            containerStyle={styles.logoutButton}
            leftIcon="logout"
          />
          <Text style={styles.poweredBy}>Powered by Pandawa Shankara Group</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border || '#E5E5E5',
  },
  logo: {
    width: 120,
    height: 75,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
    opacity: 0.8,
    marginBottom: 30,
    textAlign: 'center',
  },
  menuContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  logoutButton: {
    marginBottom: 20,
    backgroundColor: Colors.danger || '#DC3545',
  },
  poweredBy: {
    fontSize: 12,
    color: Colors.textPrimary,
    opacity: 0.7,
    textAlign: 'center',
  },
});

export default HomeScreen; 