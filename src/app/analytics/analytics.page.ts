import { Component, OnInit } from '@angular/core';
import Chart from 'chart.js/auto';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { map, combineLatest, Observable } from 'rxjs';



// Define an interface for the data structure
interface InventoryItem {
  category: string;
  quantity: number;
  name: string;
  barcode: string;
}

interface CategoryComparisonData {
  category: string;
  inventoryQuantity: number;
  storeroomQuantity: number;
}

interface TotalQuantitiesData {
  category: string;
  totalQuantity: number;
}
interface UpdateFrequencyData {
  category: string;
  updateFrequency: number;
  productName: string;
}
@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
})
export class AnalyticsPage implements OnInit {
  constructor(private firestore: AngularFirestore) {}

  ngOnInit() {
    this.generateQuantityByCategoryChart();
    this.generateQuantityByCategory();
    this.generateCategoryComparisonChart();
    this.generateTotalQuantitiesChart();
    this.generateUpdateFrequencyChart();
  }

  generateUpdateFrequencyChart() {
    combineLatest([
      this.firestore.collection('inventory').valueChanges(),
      this.firestore.collection('storeroomInventory').valueChanges(),
    ])
      .pipe(
        map(([inventoryData, storeroomData]: [any[], any[]]) => {
          const inventoryItems: InventoryItem[] = inventoryData.map(
            (item: any) => ({
              category: item.category,
              quantity: item.quantity,
              name: item.name,
              barcode: item.barcode,
            })
          );
          const storeroomItems: InventoryItem[] = storeroomData.map(
            (item: any) => ({
              category: item.category,
              quantity: item.quantity,
              name: item.name,
              barcode: item.barcode,
            })
          );
  
          const allItems = [...inventoryItems, ...storeroomItems];
          const barcodes = Array.from(new Set(allItems.map((item) => item.barcode)));
  
          const updateFrequencyData: UpdateFrequencyData[] = barcodes.map((barcode) => {
            const inventoryUpdates = inventoryItems.filter((item) => item.barcode === barcode).length;
            const storeroomUpdates = storeroomItems.filter((item) => item.barcode === barcode).length;
            const totalUpdates = inventoryUpdates + storeroomUpdates;
            const productName = allItems.find((item) => item.barcode === barcode)?.name || barcode;
            return { category: barcode, updateFrequency: totalUpdates, productName };
          });
  
          return updateFrequencyData;
        })
      )
      .subscribe((updateFrequencyData: UpdateFrequencyData[]) => {
        const ctx = document.getElementById('updateFrequencyChart') as HTMLCanvasElement;
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: updateFrequencyData.map((item) => item.productName),
            datasets: [
              {
                label: 'Update Frequency',
                data: updateFrequencyData.map((item) => item.updateFrequency),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                tension: 0.4, // Adjust the curve of the line
              },
            ],
          },
          options: {
            scales: {
              x: {
                ticks: {
                  autoSkip: true, // Enable auto-skipping of x-axis labels for better readability
                  maxRotation: 90, // Rotate x-axis labels if they are too long
                },
              },
              y: {
                beginAtZero: true, // Start y-axis from zero
              },
            },
          },
        });
      });
  }

  generateQuantityByCategoryChart() {
    this.firestore
      .collection('inventory')
      .valueChanges()
      .pipe(
        map((data: unknown[]) => {
          return data.map((item: any) => {
            return {
              category: item.category,
              quantity: item.quantity,
              name: item.name,
            } as InventoryItem;
          });
        })
      )
      .subscribe((data: InventoryItem[]) => {
        const categories = data.map((item) => item.name);
        const uniqueCategories = Array.from(new Set(categories));
        const quantitiesByCategory = uniqueCategories.map((name) => {
          const categoryItems = data.filter((item) => item.name === name);
          const totalQuantity = categoryItems.reduce((acc, curr) => acc + curr.quantity, 0);
          return totalQuantity;
        });

        const lowQuantityThreshold = 10; 
        const lowQuantityCategories = uniqueCategories.filter((category, index) => {
          return quantitiesByCategory[index] < lowQuantityThreshold;
        });

        const ctx = document.getElementById('quantityByCategoryChart') as HTMLCanvasElement;
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: uniqueCategories,
            datasets: [
              {
                type: 'line',
                label: 'Minimum',
                data: uniqueCategories.map((category) => {
                  const categoryItems = data.filter((item) => item.name === category);
                  const quantities = categoryItems.map((item) => item.quantity);
                  return Math.min(...quantities);
                }),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: false,
              },
              {
                type: 'line',
                label: 'Maximum',
                data: uniqueCategories.map((category) => {
                  const categoryItems = data.filter((item) => item.name === category);
                  const quantities = categoryItems.map((item) => item.quantity);
                  return Math.max(...quantities);
                }),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                fill: false,
              },
              {
                type: 'bar',
                label: 'Mean',
                data: uniqueCategories.map((category) => {
                  const categoryItems = data.filter((item) => item.name === category);
                  const quantities = categoryItems.map((item) => item.quantity);
                  return quantities.reduce((acc, curr) => acc + curr, 0) / quantities.length;
                }),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      });
  }


  generateQuantityByCategory(){
    this.firestore
      .collection('storeroomInventory')
      .valueChanges()
      .pipe(
        map((data: unknown[]) => {
          return data.map((item: any) => {
            return {
              category: item.category,
              quantity: item.quantity,
              name: item.name,
            } as InventoryItem;
          });
        })
      )
      .subscribe((data: InventoryItem[]) => {
        const categories = data.map((item) => item.name);
        const uniqueCategories = Array.from(new Set(categories));
        const quantitiesByCategory = uniqueCategories.map((name) => {
          const categoryItems = data.filter((item) => item.name === name);
          const totalQuantity = categoryItems.reduce((acc, curr) => acc + curr.quantity, 0);
          return totalQuantity;
        });

        const lowQuantityThreshold = 10; 
        const lowQuantityCategories = uniqueCategories.filter((category, index) => {
          return quantitiesByCategory[index] < lowQuantityThreshold;
        });

        const ctx = document.getElementById('quantityByCategoryStorommChart') as HTMLCanvasElement;
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: uniqueCategories,
            datasets: [
              {
                type: 'line',
                label: 'Minimum',
                data: uniqueCategories.map((category) => {
                  const categoryItems = data.filter((item) => item.name === category);
                  const quantities = categoryItems.map((item) => item.quantity);
                  return Math.min(...quantities);
                }),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: false,
              },
              {
                type: 'line',
                label: 'Maximum',
                data: uniqueCategories.map((category) => {
                  const categoryItems = data.filter((item) => item.name === category);
                  const quantities = categoryItems.map((item) => item.quantity);
                  return Math.max(...quantities);
                }),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                fill: false,
              },
              {
                type: 'bar',
                label: 'Mean',
                data: uniqueCategories.map((category) => {
                  const categoryItems = data.filter((item) => item.name === category);
                  const quantities = categoryItems.map((item) => item.quantity);
                  return quantities.reduce((acc, curr) => acc + curr, 0) / quantities.length;
                }),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
              },
            },
          },
        });
      });
  }


  generateCategoryComparisonChart() {
    combineLatest([
      this.firestore.collection('inventory').valueChanges(),
      this.firestore.collection('storeroomInventory').valueChanges(),
    ])
      .pipe(
        map(([inventoryData, storeroomData]: [any[], any[]]) => {
          const inventoryItems: InventoryItem[] = inventoryData.map(
            (item: any) => ({
              category: item.category,
              quantity: item.quantity,
              name: item.name,
              barcode: item.barcode,
            })
          );
          const storeroomItems: InventoryItem[] = storeroomData.map(
            (item: any) => ({
              category: item.category,
              quantity: item.quantity,
              name: item.name,
              barcode: item.barcode,
            })
          );
  
          const allItems = [...inventoryItems, ...storeroomItems];
          const categories = Array.from(new Set(allItems.map((item) => item.category)));
  
          const comparisonData: CategoryComparisonData[] = categories.map((category) => {
            const inventoryQuantity = inventoryItems
              .filter((item) => item.category === category)
              .reduce((acc, curr) => acc + curr.quantity, 0);
            const storeroomQuantity = storeroomItems
              .filter((item) => item.category === category)
              .reduce((acc, curr) => acc + curr.quantity, 0);
            return { category, inventoryQuantity, storeroomQuantity };
          });
  
          return comparisonData;
        })
      )
      .subscribe((comparisonData: CategoryComparisonData[]) => {
        const ctx = document.getElementById('categoryComparisonChart') as HTMLCanvasElement;
       new Chart(ctx, {
  type: 'bar',
  data: {
    labels: comparisonData.map((item) => item.category),
    datasets: [
      {
        label: 'Inventory',
        data: comparisonData.map((item) => item.inventoryQuantity),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Storeroom',
        data: comparisonData.map((item) => item.storeroomQuantity),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  },
  options: {
    indexAxis: 'y',
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
      },
      y: {
        stacked: true,
      },
    },
  },
});
      });
  }

  generateTotalQuantitiesChart() {
    combineLatest([
      this.firestore.collection('inventory').valueChanges(),
      this.firestore.collection('storeroomInventory').valueChanges(),
    ])
      .pipe(
        map(([inventoryData, storeroomData]: [any[], any[]]) => {
          const inventoryItems: InventoryItem[] = inventoryData.map(
            (item: any) => ({
              category: item.category,
              quantity: item.quantity,
              name: item.name,
              barcode: item.barcode, 
            })
          );
          const storeroomItems: InventoryItem[] = storeroomData.map(
            (item: any) => ({
              category: item.category,
              quantity: item.quantity,
              name: item.name,
              barcode: item.barcode, 
            })
          );

          const allItems = [...inventoryItems, ...storeroomItems];
          const categories = Array.from(new Set(allItems.map((item) => item.name)));
          const totalQuantities: TotalQuantitiesData[] = categories.map((category) => {
            const categoryItems = allItems.filter((item) => item.name === category);
            const totalQuantity = categoryItems.reduce((acc, curr) => acc + curr.quantity, 0);
            return { category, totalQuantity };
          });

          return totalQuantities;
        })
      )
      .subscribe((totalQuantities: TotalQuantitiesData[]) => {
        const ctx = document.getElementById('totalQuantitiesChart') as HTMLCanvasElement;
        new Chart(ctx, {
          type: 'bar',
          data: {
            labels: totalQuantities.map((item) => item.category),
            datasets: [
              {
                label: 'Total Quantity',
                data: totalQuantities.map((item) => item.totalQuantity),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            scales: {
              x: {
                beginAtZero: true,
              },
            },
          },
        });
      });
  }
}