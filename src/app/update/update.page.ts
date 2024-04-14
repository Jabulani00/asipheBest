import { Component, OnInit, Renderer2 } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { LoadingController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-update',
  templateUrl: './update.page.html',
  styleUrls: ['./update.page.scss'],
})
export class UpdatePage implements OnInit {
  barcode = '';
  itemName = '';
  itemCategory = '';
  itemDescription = '';
  itemQuantity = 0;
  selectedFile: File | null = null;
  productInfo: any;
  imageBase64: any;
  toggleChecked = false;
  imageUrl: any;
  newImage: any;

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private firestore: AngularFirestore,
    private fireStorage: AngularFireStorage,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.getPassedData();
  }

  hideCard() {
    const cardElement = document.getElementById('container');
    if (cardElement) {
      this.renderer.setStyle(cardElement, 'display', 'none'); // Use Renderer2's setStyle()
    }
  }
showCard() {
    const cardElement = document.getElementById('container');
    if (cardElement) {
      this.renderer.setStyle(cardElement, 'display', 'contents'); // Use Renderer2's setStyle()
    }
  }
  async closeScanner(){
    this.showCard();
    const result = await BarcodeScanner.stopScan(); // start scanning and wait for a result
    // if the result has content
  
    window.document.querySelector('ion-app')?.classList.remove('cameraView');
    document.querySelector('body')?.classList.remove('scanner-active');
  }

  async scanBarcode() {
    this.hideCard();
   
    window.document.querySelector('ion-app')?.classList.add('cameraView');
    document.querySelector('body')?.classList.add('scanner-active');
    await BarcodeScanner.checkPermission({ force: true });
    // make background of WebView transparent
    // note: if you are using ionic this might not be enough, check below
    //BarcodeScanner.hideBackground();
    const result = await BarcodeScanner.startScan(); // start scanning and wait for a result
    // if the result has content
    if (result.hasContent) {
      this.barcode = result.content;
      console.log(result.content); // log the raw scanned content
      this.showCard()
      window.document.querySelector('ion-app')?.classList.remove('cameraView');
      document.querySelector('body')?.classList.remove('scanner-active');
    }
  }

  async deleteFileIfExists(url: string): Promise<void> {
    if (url) {
      try {
        const fileRef = this.fireStorage.storage.refFromURL(url);
        await fileRef.delete();
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }
  }

  async updateItem() {
    const loader = await this.loadingController.create({
      message: 'Updating item...',
    });
    await loader.present();

    if (this.imageBase64) {
      await this.deleteFileIfExists(this.productInfo.imageUrl);
      this.imageUrl = await this.uploadImage(this.imageBase64);
    }

    try {
      const existingItemQueryStore = await this.firestore
        .collection('inventory')
        .ref.where('barcode', '==', this.barcode)
        .get();

      if (!existingItemQueryStore.empty) {
        const existingItemDoc = existingItemQueryStore.docs[0];
        const existingItemData: any = existingItemDoc.data();
        await existingItemDoc.ref.update({
          name: this.itemName,
          category: this.itemCategory,
          description: this.itemDescription,
          barcode: this.barcode,
          quantity: this.itemQuantity,
          timestamp: new Date(),
          imageUrl: this.imageUrl || existingItemData.imageUrl,
        });
        this.presentToast('Item updated successfully', 'success');
        this.clearFields(); // Clear fields after successful update
      } else {
        this.presentToast('Item not found', 'danger');
      }
    } catch (error: any) {
      this.presentToast('Error updating item: ' + error.message, 'danger');
    } finally {
      loader.dismiss();
    }
  }

  // ... (other methods remain the same) ...

  clearFields() {
    this.itemName = '';
    this.itemCategory = '';
    this.itemDescription = '';
    this.itemQuantity = 0;
    this.selectedFile = null;
    this.imageBase64 = null;
    this.newImage = null;
  }

  toggleMode() {
    if (this.toggleChecked) {
      this.barcode = '';
    }
  }

 

  onFileSelected(event: Event) {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files) {
      this.selectedFile = inputElement.files[0];
    }
  }

  async takePicture() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    });
    this.imageBase64 = image.base64String;
    this.newImage = `data:image/jpeg;base64,${image.base64String}`;
  }

  async uploadImage(file: string) {
    const fileName = Date.now().toString();
    const filePath = `images/${fileName}`;
    const fileRef = this.fireStorage.ref(filePath);
    const uploadTask = fileRef.putString(file, 'base64', {
      contentType: 'image/jpeg',
    });
    const snapshot = await uploadTask;
    return snapshot.ref.getDownloadURL();
  }

  async getPassedData() {
    if (this.router.getCurrentNavigation()?.extras.state) {
      this.productInfo = await this.router.getCurrentNavigation()?.extras.state;
      this.barcode = this.productInfo.barcode;
      this.itemName = this.productInfo.name;
      this.itemCategory = this.productInfo.category;
      this.itemDescription = this.productInfo.description;
      this.itemQuantity = this.productInfo.quantity;
      this.newImage = this.productInfo.imageUrl;
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    toast.present();
  }
}