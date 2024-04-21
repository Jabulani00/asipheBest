import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { LoadingController, NavController, ToastController } from '@ionic/angular';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';

  // Default admin credentials
  defaultAdminEmail: string = 'manager@brightness.com';
  defaultAdminPassword: string = 'best@B0101W2';

  constructor(
    private router: Router,
    private loadingController: LoadingController,
    private controller: NavController,
    private auth: AngularFireAuth,
    private firestore: AngularFirestore,
    private toastController: ToastController // Inject ToastController
  ) {}

  ngOnInit() {}

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'top',
    });
    toast.present();
  }

  async login() {
    // Email validation
    if (this.email.trim() === '') {
      this.presentToast('Please enter your email address', 'danger');
      return;
    }

    // Email format validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email)) {
      this.presentToast('Please enter a valid email address', 'danger');
      return;
    }

    // Password validation
    if (this.password.trim() === '') {
      this.presentToast('Please enter your password', 'danger');
      return;
    }

    const loader = await this.loadingController.create({
      message: 'Logging in...',
      cssClass: 'custom-loader-class',
    });
    await loader.present();

    // Check if the user is trying to log in with the default admin credentials
    if (this.email === this.defaultAdminEmail && this.password === this.defaultAdminPassword) {
      loader.dismiss();
      this.router.navigate(['/user-profiles']);
      return;
    }

    this.auth
      .signInWithEmailAndPassword(this.email, this.password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        if (user && user.emailVerified) {
          // User email is verified, proceed with login
          loader.dismiss();
          this.router.navigate(['/home']);
        } else {
          // User email is not verified
          loader.dismiss();
          this.presentToast('Please verify your email address', 'danger');
        }
      })
      .catch((error) => {
        loader.dismiss();
        const errorMessage = error.message;
        if (errorMessage.includes('wrong-password')) {
          this.presentToast('Incorrect password', 'danger');
        } else {
          this.presentToast(errorMessage, 'danger');
        }
      });
  }
}