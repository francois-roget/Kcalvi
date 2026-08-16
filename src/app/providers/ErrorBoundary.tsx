import { Component, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import i18next from '@/i18n';

type Props = PropsWithChildren<{ fallback?: ReactNode }>;
type State = { hasError: boolean };

/**
 * Un ErrorBoundary par tab principale (TECHNICAL_SPECS.MD §7.2) : capture les
 * crashes de rendu inattendus sans faire tomber toute l'app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <View style={styles.container}>
            <Text style={styles.text}>{i18next.t('errorBoundary.genericError')}</Text>
          </View>
        )
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
  },
});
