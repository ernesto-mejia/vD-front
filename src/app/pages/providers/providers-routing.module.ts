import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../auth.guard';
import { ProvidersListComponent } from '../../pages/providers/providers-list/providers-list.component';
import { ProviderAddComponent } from '../../pages/providers/provider-add/provider-add.component';
import { ProviderShowComponent } from '../../pages/providers/provider-show/provider-show.component';
import { ProviderEditComponent } from '../../pages/providers/provider-edit/provider-edit.component';
import {
  ProviderListGuard,
  ProviderViewGuard,
  ProviderCreateGuard,
  ProviderEditGuard
} from './guards/provider-permission.guards';


const routes: Routes = [
        // EMC Providers list
      {
        path: 'list',
        // component: ProvidersListGenericComponent,
        component: ProvidersListComponent,
        canActivate: [AuthGuard, ProviderListGuard],
      },
      // EMC Provider add
      {
        path: 'add',
        component: ProviderAddComponent,
        canActivate: [AuthGuard, ProviderCreateGuard],
      },
      // EMC Provider show
      {
        path: 'show/:id',
        component: ProviderShowComponent,
        canActivate: [AuthGuard, ProviderViewGuard],
      },
      // EMC Provider edit
      {
        path: 'edit/:id',
        component: ProviderEditComponent,
        canActivate: [AuthGuard, ProviderEditGuard],
      }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProvidersRoutingModule { }
