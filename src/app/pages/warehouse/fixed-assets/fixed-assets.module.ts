import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataTablesModule } from 'angular-datatables';
import { NgSelectModule } from '@ng-select/ng-select';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { FixedAssetsRoutingModule } from './fixed-assets-routing.module';
import { FixedAssetsCatalogListComponent } from './catalog/fixed-assets-catalog-list.component';
import { FixedAssetsCatalogAddComponent } from './catalog/fixed-assets-catalog-add.component';
import { FixedAssetsCatalogEditComponent } from './catalog/fixed-assets-catalog-edit.component';
import { FixedAssetsCatalogShowComponent } from './catalog/fixed-assets-catalog-show.component';
import { FixedAssetsInventoryListComponent } from './inventory/fixed-assets-inventory-list.component';
import { FixedAssetsInventoryAddComponent } from './inventory/fixed-assets-inventory-add.component';
import { FixedAssetsInventoryEditComponent } from './inventory/fixed-assets-inventory-edit.component';
import { FixedAssetsInventoryShowComponent } from './inventory/fixed-assets-inventory-show.component';

@NgModule({
  declarations: [
    FixedAssetsCatalogListComponent,
    FixedAssetsCatalogAddComponent,
    FixedAssetsCatalogEditComponent,
    FixedAssetsCatalogShowComponent,
    FixedAssetsInventoryListComponent,
    FixedAssetsInventoryAddComponent,
    FixedAssetsInventoryEditComponent,
    FixedAssetsInventoryShowComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    DataTablesModule,
    NgSelectModule,
    SidebarComponent,
    FixedAssetsRoutingModule,
  ],
})
export class FixedAssetsModule {}
