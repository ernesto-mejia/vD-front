import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// NOTE: Components have been migrated to generic components
// This module is kept for backwards compatibility but no longer exports specific components

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: []
})
export class CompaniesModule {}
