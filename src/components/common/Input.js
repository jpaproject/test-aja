import React, { useState } from 'react';
import { TextInput, StyleSheet, View, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const CustomInput = ({
                         value,
                         onChangeText,
                         placeholder,
                         secureTextEntry,
                         isPasswordVisible,
                         ...props
                     }) => {
    const [hidePassword, setHidePassword] = useState(secureTextEntry);

    return (
        <View style={styles.inputContainer}>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={hidePassword}
                placeholderTextColor="#666"
                {...props}
            />
            {
                isPasswordVisible && (
                    <TouchableOpacity style={styles.icon} onPress={() => setHidePassword(!hidePassword)}>
                        <Icon
                            name={hidePassword ? 'eye-off' : 'eye'}
                            size={20}
                            color="#666"
                        />
                    </TouchableOpacity>
                )
            }
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: 'black',
    },
    icon: {
        padding: 10,
    },
});

export default CustomInput;