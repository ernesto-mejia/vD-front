import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../../auth.guard';
import { FixedAssetsCatalogListComponent } from './catalog/fixed-assets-catalog-list.component';
import { FixedAssetsCatalogAddComponent } from './catalog/fixed-assets-catalog-add.component';
import { FixedAssetsCatalogEditComponent } from './catalog/fixed-assets-catalog-edit.component';
import { FixedAssetsCatalogShowComponent } from './catalog/fixed-assets-catalog-show.component';
import { FixedAssetsInventoryListComponent } from './inventory/fixed-assets-inventory-list.component';
import { FixedAssetsInventoryAddComponent } from './inventory/fixed-assets-inventory-add.component';
import { FixedAssetsInventoryEditComponent } from './inventory/fixed-assets-inventory-edit.component';
import { FixedAssetsInventoryShowComponent } from './inventory/fixed-assets-inventory-show.component';

const routes: Routes = [
  {
    path: 'catalog/list',
    component: FixedAssetsCatalogListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'catalog/add',
    component: FixedAssetsCatalogAddComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'catalog/show/:id',
    component: FixedAssetsCatalogShowComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'catalog/edit/:id',
    component: FixedAssetsCatalogEditComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'inventory/list',
    component: FixedAssetsInventoryListComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'inventory/add',
    component: FixedAssetsInventoryAddComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'inventory/show/:id',
    component: FixedAssetsInventoryShowComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'inventory/edit/:id',
    component: FixedAssetsInventoryEditComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FixedAssetsRoutingModule {}
