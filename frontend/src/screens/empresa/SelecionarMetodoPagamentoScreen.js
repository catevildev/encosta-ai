import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Title, IconButton } from 'react-native-paper';
import { theme } from '../../theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function SelecionarMetodoPagamentoScreen({ navigation, route }) {
    const { vaga } = route.params || {};

    const metodos = [
        { id: 'credito', label: 'Cartão de Crédito', icon: 'credit-card' },
        { id: 'debito', label: 'Cartão de Débito', icon: 'credit-card-outline' },
        { id: 'pix', label: 'Pix', icon: 'qrcode' },
        { id: 'dinheiro', label: 'Dinheiro', icon: 'cash' },
    ];

    function handleSelect(metodo) {
        navigation.navigate('Pagamento', {
            vaga,
            metodoPagamento: metodo.id,
            metodoLabel: metodo.label
        });
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color={theme.colors.text} />
                </TouchableOpacity>
                <Title style={styles.headerTitle}>Forma de Pagamento</Title>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.subtitle}>Selecione como deseja pagar:</Text>

                {metodos.map((metodo) => (
                    <TouchableOpacity
                        key={metodo.id}
                        style={styles.card}
                        onPress={() => handleSelect(metodo)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.cardLeft}>
                            <View style={styles.iconContainer}>
                                <MaterialCommunityIcons name={metodo.icon} size={24} color="#FFFFFF" />
                            </View>
                            <Text style={styles.cardText}>{metodo.label}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#6B7280" />
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.md,
        paddingTop: theme.spacing.xl,
        backgroundColor: theme.colors.background,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.colors.text,
    },
    content: {
        padding: theme.spacing.md,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        marginBottom: theme.spacing.lg,
        marginLeft: theme.spacing.xs,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1F2937', // Dark gray similar to reference
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.success, // Green accent bar
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: theme.spacing.md,
        width: 32,
        alignItems: 'center',
    },
    cardText: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '500',
    },
});
