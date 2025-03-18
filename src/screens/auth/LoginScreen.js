import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    SafeAreaView,
    Text,
    TouchableOpacity,
    Alert,
    Image,
} from 'react-native';
import CustomInput from '../../components/common/Input';
import CustomButton from '../../components/common/Button';
import { validateEmail } from '../../utils/validation';
import { Colors } from '../../constants/colors';
import { login } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }) => {
    const [fieldLogin, setFieldLogin] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const validateForm = () => {
        if (!fieldLogin) {
            setErrorMessage('Username or email is required');
            return false;
        }
        if (fieldLogin.length < 3) {
            setErrorMessage('Username or email must be at least 3 characters');
            return false;
        }
        if (fieldLogin.length > 255) {
            setErrorMessage('Username or email must not exceed 255 characters');
            return false;
        }
        if (!password) {
            setErrorMessage('Password is required');
            return false;
        }
        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters');
            return false;
        }
        return true;
    };

    const handleLogin = async () => {
        if (!validateForm()) {
            return;
        }
        try {
            setLoading(true);
            setErrorMessage(''); // Clear any previous errors
            const response = await login(fieldLogin, password);

            // Store user data and tokens
            await AsyncStorage.multiSet([
                ['@user', JSON.stringify(response.user)],
                ['@token', response.token],
                ['@refresh_token', response.refresh_token],
            ]);

            navigation.replace('MainTabs');
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.content}>
                <Image
                    source={require('../../assets/logo/logo-eh-2.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.siteTitle}>Site Monitoring</Text>
                <Text style={styles.title}>Log In to your account</Text>

                <View style={styles.formContainer}>
                    <CustomInput
                        placeholder="Username or Email"
                        value={fieldLogin}
                        onChangeText={setFieldLogin}
                        autoCapitalize="none"
                        containerStyle={styles.inputContainer}
                    />

                    <CustomInput
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        isPasswordVisible={true}
                        containerStyle={styles.inputContainer}
                    />

                    {errorMessage ? (
                        <Text style={styles.errorText}>{errorMessage}</Text>
                    ) : null}

                    <CustomButton
                        title="Login"
                        onPress={handleLogin}
                        loading={loading}
                        containerStyle={styles.buttonContainer}
                    />


                </View>


                <Text style={styles.poweredBy}>Powered by Pandawa Shankara Group</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 40,
    },
    content: {
        padding: 20,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
    },
    logo: {
        width: 240,
        height: 150,
        marginBottom: 15,
    },
    siteTitle: {
        fontSize: 20,
        fontWeight: '500',
        marginBottom: 10,
        textAlign: 'center',
        color: Colors.textPrimary,
    },
    title: {
        fontSize: 18,
        fontWeight: '400',
        marginBottom: 30,
        textAlign: 'center',
        color: Colors.textPrimary,
    },
    formContainer: {
        width: '100%',
        marginTop: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    buttonContainer: {
        marginTop: 10,
    },
    registerLink: {
        marginTop: 24,
    },
    registerText: {
        color: Colors.primary,
        textAlign: 'center',
        fontSize: 14,
    },
    poweredBy: {
        fontSize: 12,
        color: Colors.textPrimary,
        opacity: 0.7,
        marginTop: 20,
        textAlign: 'center',
    },
    navbar: {
        width: '100%',
        height: 56,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    navbarTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    companyCard: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        marginTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        elevation: 3,
    },
    companyLogo: {
        width: 60,
        height: 60,
        marginRight: 16,
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textPrimary,
        marginBottom: 4,
    },
    companyDescription: {
        fontSize: 14,
        color: Colors.textPrimary,
        opacity: 0.7,
    },
    errorText: {
        color: 'red',
        fontSize: 14,
        marginBottom: 10,
        textAlign: 'center',
    },
});

export default LoginScreen; 