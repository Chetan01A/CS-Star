import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Dimensions, KeyboardAvoidingView, Platform, 
  ActivityIndicator, Image, Alert
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { UserPlus, Mail, Lock, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../src/api';

const { width, height } = Dimensions.get('window');

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!username || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/signup', {
        username,
        email,
        password,
        captcha_token: null,
      });

      Alert.alert(
        "Success", 
        "Account created! Please check your email for the verification code.",
        [{ text: "OK", onPress: () => router.replace('/login') }]
      );
    } catch (err) {
      Alert.alert("Signup Failed", err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#000', '#111']} style={StyleSheet.absoluteFill} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.authCard}>
          <Text style={styles.logo}>CS-Star</Text>
          <Text style={styles.subtitle}>Join the next generation of social</Text>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={20} color="#b0b0b0" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#b0b0b0"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#b0b0b0" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#b0b0b0"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#b0b0b0" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#b0b0b0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity 
              style={styles.signupBtn}
              onPress={handleSignup}
              disabled={loading}
            >
              <LinearGradient 
                colors={['#00f2fe', '#4facfe']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <UserPlus size={20} color="#000" />
                    <Text style={styles.signupBtnText}>Create Account</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity style={styles.googleBtn}>
            <Image 
              source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }} 
              style={styles.googleIcon} 
            />
            <Text style={styles.googleBtnText}>Sign up with Google</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  authCard: {
    width: '100%',
    padding: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    color: '#00f2fe',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 40,
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  signupBtn: {
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  signupBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#b0b0b0',
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '600',
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  googleBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  footerText: {
    color: '#b0b0b0',
    fontSize: 14,
  },
  linkText: {
    color: '#00f2fe',
    fontSize: 14,
    fontWeight: '700',
  }
});
