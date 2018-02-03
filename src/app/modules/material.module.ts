import { NgModule } from '@angular/core';
import {
  MatButtonModule, MatCardModule, MatCheckboxModule, MatGridListModule, MatInputModule, MatPaginatorModule, MatProgressBarModule, MatProgressSpinnerModule,
  MatRadioModule,
  MatSortModule, MatTableModule, MatToolbarModule
} from '@angular/material';

const modules: any[] = [
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatGridListModule,
  MatInputModule,
  MatPaginatorModule,
  MatProgressBarModule,
  MatProgressSpinnerModule,
  MatRadioModule,
  MatSortModule,
  MatTableModule,
  MatToolbarModule
]

@NgModule({
  imports: modules,
  exports: modules
})
export class MaterialModule { }
