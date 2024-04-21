import { Component, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit {
  name: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(
    private afs: AngularFirestore,
    private afAuth: AngularFireAuth,
    private router: Router,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {}

  async register() {
    if (this.password !== this.confirmPassword) {
      await this.presentToast('Passwords do not match', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Registering...',
    });
    await loading.present();

    try {
      const userCredential: firebase.auth.UserCredential = await this.afAuth.createUserWithEmailAndPassword(
        this.email,
        this.password
      );

      if (userCredential.user) {
        const userData = {
          firstname: this.name,
          email: this.email,
        };
        const userDocRef: AngularFirestoreDocument<any> = this.afs.doc(`Users/${userCredential.user.uid}`);
        await userDocRef.set(userData);

        await this.sendVerificationEmail(userCredential.user);
        await this.router.navigate(['/login']);
      } else {
        throw new Error('User credential is missing');
      }
    } catch (error) {
      await this.handleRegistrationError(error);
    } finally {
      loading.dismiss();
    }
  }

  async sendVerificationEmail(user: firebase.User) {
    try {
      await user.sendEmailVerification();
      await this.presentToast('Verification email sent. Please check your inbox.', 'success');
    } catch (error) {
      console.error('Error sending verification email:', error);
      await this.presentToast('Error sending verification email. Please try again.', 'danger');
    }
  }

  private async handleRegistrationError(error: any) {
    let errorMessage = 'Registration failed. Please try again.';
    const errorCode = error.code;

    switch (errorCode) {
      case 'auth/email-already-in-use':
        errorMessage = 'The email address is already in use by another account.';
        break;
      case 'auth/weak-password':
        errorMessage = 'The password is too weak.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'The email address is not valid.';
        break;
      case 'auth/invalid-password':
        errorMessage = 'The password is invalid.';
        break;
      case 'auth/user-not-found':
        errorMessage = 'The user was not found.';
        break;
      case 'auth/wrong-password':
        errorMessage = 'The password is incorrect.';
        break;
      default:
        console.error('Registration error:', error);
        break;
    }

    await this.presentToast(errorMessage, 'danger');
  }

  private async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    toast.present();
  }
}