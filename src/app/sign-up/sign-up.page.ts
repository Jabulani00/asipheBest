import { Component, OnInit } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
})
export class SignUpPage implements OnInit {
  name: any;
  email: any;
  password: any;
  confirm_password: any;
  selectedRole: any;

  constructor(
    private db: AngularFirestore,
    private Auth: AngularFireAuth,
    private router: Router,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {}

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top',
    });
    toast.present();
  }

  async Register() {
    if (this.name == '') {
      this.presentToast('Please enter your full name', 'danger');
      return;
    }

    if (this.email == '') {
      this.presentToast('Please enter your email address', 'danger');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email)) {
      this.presentToast('Please enter a valid email address', 'danger');
      return;
    }

    if (this.password == '') {
      this.presentToast('Please enter a password', 'danger');
      return;
    }

    if (this.password !== this.confirm_password) {
      this.presentToast('Passwords do not match', 'danger');
      return;
    }

    const loader = await this.loadingController.create({
      message: 'Registering you...',
      cssClass: 'custom-loader-class'
    });
    await loader.present();

    this.Auth.createUserWithEmailAndPassword(this.email, this.password)
      .then((userCredential: any) => {
        if (userCredential.user) {
          this.db
            .collection('Users')
            .add({
              name: this.name,
              email: this.email,
              status: "pending",
              role: this.selectedRole,
            })
            .then(() => {
              loader.dismiss();
              this.presentToast('User data added successfully', 'success');
              this.router.navigate(['/profile']);
            })
            .catch((error: any) => {
              loader.dismiss();
              this.presentToast('Error adding user data: ' + error.message, 'danger');
            });
        } else {
          loader.dismiss();
          this.presentToast('User credential is missing', 'danger');
        }
      })
      .catch((error: any) => {
        loader.dismiss();
        this.presentToast('Error creating user: ' + error.message, 'danger');
      });
  }
}