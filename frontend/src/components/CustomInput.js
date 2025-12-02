import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { theme } from '../theme';

const CustomInput = ({
    icon,
    isPassword,
    rightIcon,
    onRightIconPress,
    style,
    ...props
}) => {
    return (
        <View style={styles.inputContainer}>
            {icon && (
                <MaterialCommunityIcons
                    name={icon}
                    size={24}
                    color={theme.colors.primary}
                    style={styles.inputIcon}
                />
            )}
            <TextInput
                style={[styles.input, style]}
                placeholderTextColor="#666"
                {...props}
            />
            {isPassword && (
                <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
                    <MaterialCommunityIcons
                        name={rightIcon || (props.secureTextEntry ? "eye" : "eye-off")}
                        size={24}
                        color={theme.colors.primary}
                    />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.primary,
        borderRadius: 4,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 12,
    },
    inputIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: theme.colors.text,
    },
    rightIcon: {
        padding: 4,
    },
});

export default CustomInput;
