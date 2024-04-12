import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import {   ToastController , AlertController} from '@ionic/angular';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  userDocument: any;
  navController: NavController;

  constructor(  private alertController: AlertController
               ,private navCtrl: NavController,
              private auth: AngularFireAuth,
              private db: AngularFirestore,
              private toastController: ToastController) {this.navController = navCtrl;}

  async getUser(): Promise<void> {
    try {
      const user = await this.auth.currentUser;

      if (user) {
        const querySnapshot = await this.db
          .collection('Users', ref => ref.where('email', '==', user.email))
          .valueChanges({ idField: 'id' })
          .pipe(first())
          .toPromise();

        if (querySnapshot && querySnapshot.length > 0) {
          this.userDocument = querySnapshot[0];
          console.log('User Document:', this.userDocument); // Log user document
        }
      }
    } catch (error) {
      console.error('Error getting user document:', error);
      throw error; // Rethrow error for better error handling
    }
  }

  async navigateBasedOnRole(page: string): Promise<void> {
    try {
      await this.getUser();

      let authorized = false;
      let message = '';

      if (this.userDocument && this.userDocument.role) {
        console.log('User Role:', this.userDocument.role); // Log user role
    
        switch (page) {
            case 'add-inventory-storeroom':
                authorized = this.userDocument.role === 'picker' || this.userDocument.role === 'Manager';
                message = authorized ? 'Authorized user for picker page.' : 'Unauthorized user for picker page.';
                break;
            case 'analytics':
                authorized = this.userDocument.role === 'Delivery' || this.userDocument.role === 'Manager';
                message = authorized ? 'Authorized user for delivery page.' : 'Unauthorized user for delivery page.';
                break;
            case 'add-inventory':
            case 'view':
                authorized = this.userDocument.role === 'Manager';
                message = authorized ? 'Authorized user for this page.' : 'Access denied for this page.';
                break;
                case 'storeroom':
                  authorized = this.userDocument.role === 'Manager';
                  message = authorized ? 'Authorized user for this page.' : 'Access denied for this page.';
                  break;
                case 'view':
                authorized = this.userDocument.role === 'Manager';
                message = authorized ? 'Authorized user for this page.' : 'Access denied for this page.';
                break;
            default:
                authorized = false;
                message = 'Invalid page.';
                break;
        }
    } else {
        authorized = false;
        message = 'User document or role not found.';
    }
    

      if (authorized) {
        this.navCtrl.navigateForward('/' + page);
      } else {
        const toast = await this.toastController.create({
          message: 'Unauthorized Access: ' + message,
          duration: 2000,
          position: 'top'
        });
        toast.present();
      }
    } catch (error) {
      console.error('Error navigating based on role:', error);
      throw error; // Rethrow error for better error handling
    }
  }

  navigateToAddInventory(): Promise<void> {
    return this.navigateBasedOnRole('add-inventory');
  }

  navigateToUpdateInventory(): Promise<void> {
    return this.navigateBasedOnRole('view');
  }

  navigateToPickupInventory(): Promise<void> {
    return this.navigateBasedOnRole('add-inventory-storeroom');
  }

  navigateToDeliverInventory(): Promise<void> {
    return this.navigateBasedOnRole('analytics');
  }
  navigateToViewStoreRoom(): Promise<void> {
    return this.navigateBasedOnRole('storeroom');
  }

  navigateToStoreInventory(): Promise<void> {
    return this.navigateBasedOnRole('view');
  }

  async presentConfirmationAlert() {
  const alert = await this.alertController.create({
    header: 'Confirmation',
    message: 'Are you sure you want to SIGN OUT?',
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel',
       cssClass: 'my-custom-alert',
        handler: () => {
          console.log('Confirmation canceled');
        }
      }, {
        text: 'Confirm',
        handler: () => {
         
          
          this.auth.signOut().then(() => {
            this.navController.navigateForward("/login");
            this.presentToast()
      
      
          }).catch((error) => {
          
          });



        }
      }
    ]
  });
  await alert.present();
}

async presentToast() {
  const toast = await this.toastController.create({
    message: 'SIGNED OUT!',
    duration: 1500,
    position: 'top',
  
  });

  await toast.present();
}
}
