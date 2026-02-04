import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    profile: any | null | undefined; // undefined = checking/not started, null = not found
    loading: boolean; // loading session ONLY
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    profile: undefined,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<any | null | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
            }

            setProfile(data || null);
            return data;
        } catch (error) {
            console.error('Error in fetchProfile:', error);
            setProfile(null);
            return null;
        }
    };

    useEffect(() => {
        let isMounted = true;

        // Écouter les changements d'état (plus robuste que getSession seul)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!isMounted) return;

            console.log('Auth state changed:', event);

            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            // On libère le loading de session dès qu'on a une réponse auth
            setLoading(false);

            if (currentSession?.user) {
                // Le profil est chargé en parallèle, sans bloquer 'loading'
                fetchProfile(currentSession.user.id);
            } else {
                setProfile(null);
            }
        });

        // Initialisation de secours au cas où onAuthStateChange met du temps
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            if (!isMounted) return;
            if (loading) { // Ne le faire que si onAuthStateChange n'a pas encore répondu
                setSession(initialSession);
                setUser(initialSession?.user ?? null);
                setLoading(false);
                if (initialSession?.user) {
                    fetchProfile(initialSession.user.id);
                } else {
                    setProfile(null);
                }
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error during signOut:', error);
        } finally {
            setUser(null);
            setSession(null);
            setProfile(null);
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
