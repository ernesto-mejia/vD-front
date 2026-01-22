import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductsListComponent } from './products-list/products-list.component';
import { ProductAddComponent } from './product-add/product-add.component';
import { ProductShowComponent } from './product-show/product-show.component';
import { ProductEditComponent } from './product-edit/product-edit.component';
import { AuthGuard } from '../../../core/guards/auth.guard';

const routes: Routes = [
  // EMC products list
  {
    path: 'list',
    component: ProductsListComponent,
    canActivate: [AuthGuard],
  },
  //EMC Product add
  {
    path: 'add',
    component: ProductAddComponent,
    canActivate: [AuthGuard],
  },
  // EMC Product show
  {
    path: 'show/:id',
    component: ProductShowComponent,
    canActivate: [AuthGuard],
  },
  // EMC Product edit
  {
    path: 'edit/:id',
    component: ProductEditComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductsRoutingModule {}
