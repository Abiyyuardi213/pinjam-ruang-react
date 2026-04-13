import React from 'react';
import { View, StyleSheet, ViewProps, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, style, ...props }: CardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View 
      style={[
        styles.card, 
        { 
          backgroundColor: isDark ? '#1C1C1C' : '#FFFFFF',
          borderColor: isDark ? '#2E2E2E' : '#E2E8F0',
        }, 
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ children, style, ...props }: CardProps) {
  return <View style={[styles.cardHeader, style]} {...props}>{children}</View>;
}

export function CardTitle({ children, style, ...props }: any) {
  return (
    <ThemedText 
      type="defaultSemiBold" 
      style={[styles.cardTitle, style]} 
      {...props}
    >
      {children}
    </ThemedText>
  );
}

export function CardDescription({ children, style, ...props }: any) {
  return (
    <ThemedText 
      style={[styles.cardDescription, style]} 
      {...props}
    >
      {children}
    </ThemedText>
  );
}

export function CardContent({ children, style, ...props }: CardProps) {
  return <View style={[styles.cardContent, style]} {...props}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    padding: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  cardDescription: {
    fontSize: 13,
    opacity: 0.5,
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
  },
});
