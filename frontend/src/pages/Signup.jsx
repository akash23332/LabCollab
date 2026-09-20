import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    institution: '',
    email: '',
    role: 'student',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const passwordStrength = useMemo(() => {
    const pwd = form.password;
    if (!pwd) return { level: 0, label: '', suffix: '' };
    if (pwd.length < 6) return { level: 1, label: 'Weak', suffix: 'weak' };

    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

    if (pwd.length >= 8 && hasLetters && hasNumbers && hasSpecial) {
      return { level: 3, label: 'Strong', suffix: 'strong' };
    }
    if ((hasLetters && hasNumbers) || pwd.length >= 8) {
      return { level: 2, label: 'Medium', suffix: 'medium' };
    }
    return { level: 1, label: 'Weak', suffix: 'weak' };
  }, [form.password]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Please enter your full name.');
    if (!form.institution.trim()) return setError('Please enter your institution / college.');
    if (!form.email.trim()) return setError('Please enter your university email.');
    if (!form.password) return setError('Please enter a password.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (!agreed) return setError('You must agree to the Terms of Service and Privacy Policy.');

    setBusy(true);
    try {
      const created = await signup({
        name: form.name,
        institution: form.institution,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      if (created?.role === 'admin' || form.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Error creating account.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__card auth__card--signup">
        <Link to="/" className="auth__brand">
          <span className="auth__brand-icon">⚗️</span> LabCollab
        </Link>
        <h1>Create your account</h1>
        <p className="auth__sub">Join your campus lab network in under a minute.</p>

        {error && <div className="auth__error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth__form">
          <label>
            Full name
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Maya Chen"
              required
              autoFocus
            />
          </label>

          <label>
            Institution / College
            <input
              value={form.institution}
              onChange={(e) => set('institution', e.target.value)}
              placeholder="e.g. Indian Institute of Technology"
              required
            />
          </label>

          <div style={{ marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#6b5e52', display: 'block', marginBottom: '0.45rem' }}>
              Account Type
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => set('role', 'student')}
                style={{
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  border: form.role === 'student' ? '2px solid #c58a48' : '1px solid #dcd5c9',
                  backgroundColor: form.role === 'student' ? '#fcf7f0' : '#ffffff',
                  color: form.role === 'student' ? '#784614' : '#6b5e52',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>🎓</span>
                <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Student / User</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.75 }}>Book instruments & sessions</span>
              </button>

              <button
                type="button"
                onClick={() => set('role', 'admin')}
                style={{
                  padding: '0.75rem 0.5rem',
                  borderRadius: '12px',
                  border: form.role === 'admin' ? '2px solid #241b16' : '1px solid #dcd5c9',
                  backgroundColor: form.role === 'admin' ? '#241b16' : '#ffffff',
                  color: form.role === 'admin' ? '#ffffff' : '#6b5e52',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>⚙️</span>
                <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>Lab Admin</span>
                <span style={{ fontSize: '0.7rem', opacity: form.role === 'admin' ? 0.85 : 0.75 }}>Manage lab, requests & catalog</span>
              </button>
            </div>
            {form.role === 'admin' && (
              <p style={{ fontSize: '0.74rem', color: '#965d25', marginTop: '0.45rem', margin: '0.45rem 0 0' }}>
                ✓ Admin accounts receive full access to the Admin Portal (approvals, schedules, equipment management).
              </p>
            )}
          </div>

          <label>
            University Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="you@student.edu"
              required
            />
          </label>

          <div className="auth__row">
            <label>
              Password
              <div className="auth__input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                />
                <button
                  type="button"
                  className="auth__eye"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label>
              Confirm Password
              <div className="auth__input-wrap">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  placeholder="Confirm password"
                  required
                />
                <button
                  type="button"
                  className="auth__eye"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
          </div>

          {form.password && (
            <div className="auth__strength">
              <div className="auth__strength-bars">
                <div className={`auth__strength-bar ${passwordStrength.level >= 1 ? `auth__strength-bar--${passwordStrength.suffix}` : ''}`} />
                <div className={`auth__strength-bar ${passwordStrength.level >= 2 ? `auth__strength-bar--${passwordStrength.suffix}` : ''}`} />
                <div className={`auth__strength-bar ${passwordStrength.level >= 3 ? `auth__strength-bar--${passwordStrength.suffix}` : ''}`} />
              </div>
              <div className={`auth__strength-text auth__strength-text--${passwordStrength.suffix}`}>
                {passwordStrength.label}
              </div>
            </div>
          )}

          <label className="auth__terms">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
            />
            <span>I agree to the LabCollab Terms of Service and Privacy Policy.</span>
          </label>

          <button type="submit" className="auth__submit" disabled={busy}>
            {busy ? 'Creating account…' : (
              <>
                <span>Create Account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
