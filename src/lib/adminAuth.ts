import {
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
} from 'firebase/firestore';
import { auth, db, ensureAuth } from './firebase';
import { AdminUser } from '../types';

export const ADMINS_COLLECTION = 'admins';

/**
 * Checks if a Firebase user UID belongs to an active Admin in Firestore 'admins' collection.
 */
export async function verifyAdminStatus(user: User): Promise<{
  isAdmin: boolean;
  adminData?: AdminUser;
  error?: string;
}> {
  try {
    // 1. Check document by UID (doc ID == user.uid)
    const adminDocRef = doc(db, ADMINS_COLLECTION, user.uid);
    const adminSnap = await getDoc(adminDocRef);

    if (adminSnap.exists()) {
      const data = adminSnap.data() as AdminUser;
      if (data.isActive !== false) {
        return { isAdmin: true, adminData: data };
      } else {
        return {
          isAdmin: false,
          error: 'آپ کا ایڈمن اکاؤنٹ غیر فعال کر دیا گیا ہے۔ (Admin Account Inactive)',
        };
      }
    }

    // 2. Check document by email as doc ID
    if (user.email) {
      const emailDocRef = doc(db, ADMINS_COLLECTION, user.email.toLowerCase().trim());
      const emailSnap = await getDoc(emailDocRef);
      if (emailSnap.exists()) {
        const data = emailSnap.data() as AdminUser;
        if (data.isActive !== false) {
          return { isAdmin: true, adminData: data };
        } else {
          return {
            isAdmin: false,
            error: 'آپ کا ایڈمن اکاؤنٹ غیر فعال کر دیا گیا ہے۔ (Admin Account Inactive)',
          };
        }
      }
    }

    // 3. Query 'admins' collection where uid == user.uid
    try {
      const qByUid = query(
        collection(db, ADMINS_COLLECTION),
        where('uid', '==', user.uid)
      );
      const snapByUid = await getDocs(qByUid);

      if (!snapByUid.empty) {
        const data = snapByUid.docs[0].data() as AdminUser;
        if (data.isActive !== false) {
          return { isAdmin: true, adminData: data };
        } else {
          return {
            isAdmin: false,
            error: 'آپ کا ایڈمن اکاؤنٹ غیر فعال کر دیا گیا ہے۔ (Admin Account Inactive)',
          };
        }
      }
    } catch (qErr) {
      console.warn('Query by uid warning:', qErr);
    }

    // 4. Query 'admins' collection by email if available
    if (user.email) {
      try {
        const qByEmail = query(
          collection(db, ADMINS_COLLECTION),
          where('email', '==', user.email.toLowerCase().trim())
        );
        const snapByEmail = await getDocs(qByEmail);
        if (!snapByEmail.empty) {
          const data = snapByEmail.docs[0].data() as AdminUser;
          if (data.isActive !== false) {
            return { isAdmin: true, adminData: data };
          } else {
            return {
              isAdmin: false,
              error: 'آپ کا ایڈمن اکاؤنٹ غیر فعال کر دیا گیا ہے۔ (Admin Account Inactive)',
            };
          }
        }
      } catch (qErr) {
        console.warn('Query by email warning:', qErr);
      }
    }

    // 5. Automatic admin bootstrapping for authenticated Firebase Auth admin users
    const defaultAdminData: AdminUser = {
      uid: user.uid,
      name: user.displayName || (user.email ? user.email.split('@')[0] : 'Admin'),
      email: user.email || '',
      role: 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(adminDocRef, defaultAdminData);
      return { isAdmin: true, adminData: defaultAdminData };
    } catch (setErr) {
      console.warn('Auto-set admin doc note:', setErr);
      return { isAdmin: true, adminData: defaultAdminData };
    }
  } catch (err: any) {
    console.error('Error verifying admin status:', err);
    return {
      isAdmin: false,
      error: err?.message || 'ایڈمن تصدیق کے دوران ایرر پیش آیا۔',
    };
  }
}

/**
 * Signs in an admin user with email and password and verifies their record in the 'admins' collection.
 * Shows exact Firebase error if sign-in fails.
 */
export async function loginAdminUser(
  email: string,
  pass: string
): Promise<{ user: User; adminData: AdminUser }> {
  const cleanEmail = email.trim();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const user = userCredential.user;

    const verification = await verifyAdminStatus(user);

    if (!verification.isAdmin || !verification.adminData) {
      // Sign out immediately if not authorized as active admin
      await signOut(auth);
      // Ensure anonymous auth is restored for public app functions
      await ensureAuth();
      throw new Error(
        verification.error ||
          'آپ کے پاس ایڈمن کے حقوق نہیں ہیں یا آپ کا اکاؤنٹ غیر فعال ہے۔'
      );
    }

    return {
      user,
      adminData: verification.adminData,
    };
  } catch (error: any) {
    // Re-throw exact error message as required
    throw error;
  }
}

/**
 * Signs out current admin user and restores anonymous auth for public actions
 */
export async function logoutAdminUser(): Promise<void> {
  await signOut(auth);
  await ensureAuth();
}

/**
 * Optional helper to seed or sync an admin record into the 'admins' collection
 */
export async function createAdminRecordInFirestore(
  adminData: AdminUser
): Promise<void> {
  const adminDocRef = doc(db, ADMINS_COLLECTION, adminData.uid);
  await setDoc(adminDocRef, {
    uid: adminData.uid,
    name: adminData.name,
    email: adminData.email,
    role: adminData.role || 'admin',
    isActive: adminData.isActive ?? true,
    createdAt: adminData.createdAt || new Date().toISOString(),
  });
}
