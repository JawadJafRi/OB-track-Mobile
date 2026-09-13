import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

/**
 * Themed replacement for React Native's `Alert`.
 *
 * `Alert.alert` renders the platform dialog, which on Android is the grey
 * Material sheet with teal text buttons — it cannot be restyled from JS, so it
 * broke the Direction C look every time a task was ended or a logout confirmed.
 * This renders the same interactions as a modal we control.
 *
 * The API is promise-based rather than callback-based, so a confirmation reads
 * as a straight line in the calling code instead of a nested handler.
 */

type ConfirmOptions = {
  title: string;
  message?: string;
  /** Label for the affirmative action. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label for the dismissive action. Defaults to "Cancel". */
  cancelLabel?: string;
  /**
   * Marks the affirmative action as irreversible. Kept as a distinct flag from
   * the label so the styling decision does not depend on the wording.
   */
  destructive?: boolean;
};

type NotifyOptions = {
  title: string;
  message?: string;
  /** Label for the single dismiss button. Defaults to "OK". */
  dismissLabel?: string;
};

type DialogApi = {
  /** Resolves true if the affirmative action was chosen. */
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  /** Resolves once the notice has been dismissed. */
  notify: (options: NotifyOptions) => Promise<void>;
};

const DialogContext = createContext<DialogApi | undefined>(undefined);

type Pending =
  | ({ kind: 'confirm' } & ConfirmOptions)
  | ({ kind: 'notify' } & NotifyOptions);

export const DialogProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [pending, setPending] = useState<Pending | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    setPending(null);
    const resolve = resolver.current;
    resolver.current = null;
    resolve?.(value);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      resolver.current = resolve;
      setPending({ kind: 'confirm', ...options });
    });
  }, []);

  const notify = useCallback((options: NotifyOptions) => {
    return new Promise<void>(resolve => {
      resolver.current = () => resolve();
      setPending({ kind: 'notify', ...options });
    });
  }, []);

  const api = useMemo(() => ({ confirm, notify }), [confirm, notify]);

  const isConfirm = pending?.kind === 'confirm';
  const destructive = isConfirm && pending.destructive;

  return (
    <DialogContext.Provider value={api}>
      {children}

      <Modal
        visible={pending !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        // Android back button dismisses, matching the platform expectation.
        onRequestClose={() => settle(false)}
      >
        <TouchableWithoutFeedback onPress={() => settle(false)}>
          <View style={styles.backdrop}>
            {/* Swallow taps on the card so they do not dismiss the dialog. */}
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.card}>
                <View style={styles.head}>
                  <View style={styles.accentBar} />
                  <Text style={styles.title}>{pending?.title}</Text>
                </View>

                {pending?.message ? (
                  <Text style={styles.message}>{pending.message}</Text>
                ) : null}

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => settle(true)}
                    activeOpacity={0.85}
                    style={[
                      styles.primary,
                      destructive && styles.primaryDestructive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.primaryLabel,
                        destructive && styles.primaryLabelDestructive,
                      ]}
                    >
                      {isConfirm
                        ? pending.confirmLabel ?? 'Confirm'
                        : pending?.dismissLabel ?? 'OK'}
                    </Text>
                  </TouchableOpacity>

                  {isConfirm ? (
                    <TouchableOpacity
                      onPress={() => settle(false)}
                      activeOpacity={0.7}
                      style={styles.secondary}
                    >
                      <Text style={styles.secondaryLabel}>
                        {pending.cancelLabel ?? 'Cancel'}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </DialogContext.Provider>
  );
};

export function useDialog(): DialogApi {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,22,26,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    shadowColor: '#14161a',
    shadowOpacity: 0.3,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  accentBar: {
    width: 4,
    height: 19,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  title: { flex: 1, ...typography.cardTitle, fontSize: 18, color: colors.ink },
  message: {
    ...typography.caption,
    fontSize: 14,
    lineHeight: 20,
    color: colors.secondaryAlt,
  },
  actions: { marginTop: spacing.xs },
  primary: {
    height: 52,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { ...typography.button, color: colors.onPrimary },
  /*
   * An irreversible action gets the tinted outline treatment the canvas uses
   * for "Log out" on the profile screen, rather than the solid red fill. Since
   * the brand colour is already red, a filled red button reads as the ordinary
   * affirmative — the lighter treatment is what marks this one as different.
   */
  primaryDestructive: {
    backgroundColor: colors.tintBgSoft,
    borderWidth: 1,
    borderColor: colors.tintBorder,
  },
  primaryLabelDestructive: { color: colors.primary },
  secondary: {
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  secondaryLabel: { ...typography.bodySm, color: colors.secondaryAlt },
});
