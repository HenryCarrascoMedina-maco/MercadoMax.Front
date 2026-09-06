import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { LayoutComponent } from './features/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UserListComponent } from './features/auth/users/user-list.component';
import { RoleListComponent } from './features/auth/roles/role-list.component';
import { PermissionListComponent } from './features/auth/permissions/permission-list.component';
import { ProductCategoryListComponent } from './features/maestros/product-category/product-category-list.component';
import { ProductCategoryFormComponent } from './features/maestros/product-category/product-category-form.component';
import { ProductCategoryDetailComponent } from './features/maestros/product-category/product-category-detail.component';
import { ProductListComponent } from './features/maestros/product/product-list.component';
import { ProductSizeListComponent } from './features/maestros/product-size/product-size-list.component';
import { BrandListComponent } from './features/maestros/brand/brand-list.component';
import { SupplierListComponent } from './features/maestros/supplier/supplier-list.component';
import { LogisticUnitListComponent } from './features/maestros/logistic-unit/logistic-unit-list.component';
import { PavilionListComponent } from './features/maestros/pavilion/pavilion-list.component';
import { StallListComponent } from './features/maestros/stall/stall-list.component';
import { GuideListComponent } from './features/guias/guide-list/guide-list.component';
import { CarrierListComponent } from './features/transporte/carrier-list/carrier-list.component';
import { TruckListComponent } from './features/transporte/truck-list/truck-list.component';
import { TransportRateListComponent } from './features/transporte/transport-rate-list/transport-rate-list.component';
import { SettlementListComponent } from './features/transporte/settlement-list/settlement-list.component';
import { ReceptionListComponent } from './features/recepcion/reception-list/reception-list.component';
import { ShortageListComponent } from './features/recepcion/shortage-list/shortage-list.component';
import { InventoryListComponent } from './features/comerciante/inventory-list/inventory-list.component';
import { ReceptionConfirmationListComponent } from './features/comerciante/reception-confirmation-list/reception-confirmation-list.component';
import { InventoryMovementListComponent } from './features/comerciante/inventory-movement-list/inventory-movement-list.component';
import { SaleListComponent } from './features/finanzas/sale-list/sale-list.component';
import { AccountPayableListComponent } from './features/finanzas/account-payable-list/account-payable-list.component';
import { AccountStatementComponent } from './features/finanzas/account-statement/account-statement.component';
import { ProductFormComponent } from './features/maestros/product/product-form.component';
import { ProductDetailComponent } from './features/maestros/product/product-detail.component';
import { ProductSizeFormComponent } from './features/maestros/product-size/product-size-form.component';
import { ProductSizeDetailComponent } from './features/maestros/product-size/product-size-detail.component';
import { BrandFormComponent } from './features/maestros/brand/brand-form.component';
import { BrandDetailComponent } from './features/maestros/brand/brand-detail.component';
import { SupplierFormComponent } from './features/maestros/supplier/supplier-form.component';
import { SupplierDetailComponent } from './features/maestros/supplier/supplier-detail.component';
import { LogisticUnitFormComponent } from './features/maestros/logistic-unit/logistic-unit-form.component';
import { LogisticUnitDetailComponent } from './features/maestros/logistic-unit/logistic-unit-detail.component';
import { PavilionFormComponent } from './features/maestros/pavilion/pavilion-form.component';
import { PavilionDetailComponent } from './features/maestros/pavilion/pavilion-detail.component';
import { StallFormComponent } from './features/maestros/stall/stall-form.component';
import { StallDetailComponent } from './features/maestros/stall/stall-detail.component';
import { CarrierFormComponent } from './features/transporte/carrier-list/carrier-form.component';
import { CarrierDetailComponent } from './features/transporte/carrier-list/carrier-detail.component';
import { TruckFormComponent } from './features/transporte/truck-list/truck-form.component';
import { TruckDetailComponent } from './features/transporte/truck-list/truck-detail.component';
import { TransportRateFormComponent } from './features/transporte/transport-rate-list/transport-rate-form.component';
import { TransportRateDetailComponent } from './features/transporte/transport-rate-list/transport-rate-detail.component';
import { ReceptionFormComponent } from './features/recepcion/reception-list/reception-form.component';
import { ReceptionDetailComponent } from './features/recepcion/reception-list/reception-detail.component';
import { ShortageFormComponent } from './features/recepcion/shortage-list/shortage-form.component';
import { InventoryFormComponent } from './features/comerciante/inventory-list/inventory-form.component';
import { InventoryDetailComponent } from './features/comerciante/inventory-list/inventory-detail.component';
import { InventoryMovementFormComponent } from './features/comerciante/inventory-movement-list/inventory-movement-form.component';
import { ReceptionConfirmationFormComponent } from './features/comerciante/reception-confirmation-list/reception-confirmation-form.component';
import { UserFormComponent } from './features/auth/users/user-form.component';
import { UserDetailComponent } from './features/auth/users/user-detail.component';
import { RoleFormComponent } from './features/auth/roles/role-form.component';
import { RoleDetailComponent } from './features/auth/roles/role-detail.component';
import { PermissionFormComponent } from './features/auth/permissions/permission-form.component';
import { PermissionDetailComponent } from './features/auth/permissions/permission-detail.component';
import { SettlementFormComponent } from './features/transporte/settlement-list/settlement-form.component';
import { SettlementDetailComponent } from './features/transporte/settlement-list/settlement-detail.component';
import { SaleFormComponent } from './features/finanzas/sale-list/sale-form.component';
import { SaleDetailComponent } from './features/finanzas/sale-list/sale-detail.component';
import { AccountPayableFormComponent } from './features/finanzas/account-payable-list/account-payable-form.component';
import { AccountPayableDetailComponent } from './features/finanzas/account-payable-list/account-payable-detail.component';
import { GuideFormComponent } from './features/guias/guide-list/guide-form.component';
import { GuideDetailComponent } from './features/guias/guide-list/guide-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'inicio', component: DashboardComponent },
      {
        path: 'users',
        canActivate: [permissionGuard],
        data: { permission: 'Users:List' },
        children: [
          { path: '', component: UserListComponent },
          { path: 'nuevo', component: UserFormComponent, canActivate: [permissionGuard], data: { permission: 'Users:Create', mode: 'create' } },
          { path: ':id/editar', component: UserFormComponent, canActivate: [permissionGuard], data: { permission: 'Users:Update', mode: 'edit' } },
          { path: ':id', component: UserDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'roles',
        canActivate: [permissionGuard],
        data: { permission: 'Roles:List' },
        children: [
          { path: '', component: RoleListComponent },
          { path: 'nuevo', component: RoleFormComponent, canActivate: [permissionGuard], data: { permission: 'Roles:Create', mode: 'create' } },
          { path: ':id/editar', component: RoleFormComponent, canActivate: [permissionGuard], data: { permission: 'Roles:Update', mode: 'edit' } },
          { path: ':id', component: RoleDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'permissions',
        canActivate: [permissionGuard],
        data: { permission: 'Permissions:List' },
        children: [
          { path: '', component: PermissionListComponent },
          { path: 'nuevo', component: PermissionFormComponent, canActivate: [permissionGuard], data: { permission: 'Permissions:Create', mode: 'create' } },
          { path: ':id/editar', component: PermissionFormComponent, canActivate: [permissionGuard], data: { permission: 'Permissions:Update', mode: 'edit' } },
          { path: ':id', component: PermissionDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'product-categories',
        canActivate: [permissionGuard],
        data: { permission: 'Masters:List' },
        children: [
          { path: '', component: ProductCategoryListComponent },
          { path: 'nuevo', component: ProductCategoryFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Create', mode: 'create' } },
          { path: ':id/editar', component: ProductCategoryFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Update', mode: 'edit' } },
          { path: ':id', component: ProductCategoryDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'products',
        canActivate: [permissionGuard],
        data: { permission: 'Masters:List' },
        children: [
          { path: '', component: ProductListComponent },
          { path: 'nuevo', component: ProductFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Create', mode: 'create' } },
          { path: ':id/editar', component: ProductFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Update', mode: 'edit' } },
          { path: ':id', component: ProductDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'product-sizes',
        canActivate: [permissionGuard],
        data: { permission: 'Masters:List' },
        children: [
          { path: '', component: ProductSizeListComponent },
          { path: 'nuevo', component: ProductSizeFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Create', mode: 'create' } },
          { path: ':id/editar', component: ProductSizeFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Update', mode: 'edit' } },
          { path: ':id', component: ProductSizeDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'brands',
        canActivate: [permissionGuard],
        data: { permission: 'Masters:List' },
        children: [
          { path: '', component: BrandListComponent },
          { path: 'nuevo', component: BrandFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Create', mode: 'create' } },
          { path: ':id/editar', component: BrandFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Update', mode: 'edit' } },
          { path: ':id', component: BrandDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'suppliers',
        canActivate: [permissionGuard],
        data: { permission: 'Masters:List' },
        children: [
          { path: '', component: SupplierListComponent },
          { path: 'nuevo', component: SupplierFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Create', mode: 'create' } },
          { path: ':id/editar', component: SupplierFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Update', mode: 'edit' } },
          { path: ':id', component: SupplierDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'logistic-units',
        canActivate: [permissionGuard],
        data: { permission: 'Masters:List' },
        children: [
          { path: '', component: LogisticUnitListComponent },
          { path: 'nuevo', component: LogisticUnitFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Create', mode: 'create' } },
          { path: ':id/editar', component: LogisticUnitFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Update', mode: 'edit' } },
          { path: ':id', component: LogisticUnitDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'pavilions',
        canActivate: [permissionGuard],
        data: { permission: 'Masters:List' },
        children: [
          { path: '', component: PavilionListComponent },
          { path: 'nuevo', component: PavilionFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Create', mode: 'create' } },
          { path: ':id/editar', component: PavilionFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Update', mode: 'edit' } },
          { path: ':id', component: PavilionDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'stalls',
        canActivate: [permissionGuard],
        data: { permission: 'Masters:List' },
        children: [
          { path: '', component: StallListComponent },
          { path: 'nuevo', component: StallFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Create', mode: 'create' } },
          { path: ':id/editar', component: StallFormComponent, canActivate: [permissionGuard], data: { permission: 'Masters:Update', mode: 'edit' } },
          { path: ':id', component: StallDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'guides',
        canActivate: [permissionGuard],
        data: { permission: 'Guides:List' },
        children: [
          { path: '', component: GuideListComponent },
          // El alta de una guía son dos pasos y dos componentes distintos:
          // `GuideFormComponent` guarda la cabecera y `GuideDetailComponent`
          // carga las líneas. Este último atiende `/:id/editar` y `/:id`, que es
          // lo que documenta su propia cabecera.
          { path: 'nuevo', component: GuideFormComponent, canActivate: [permissionGuard], data: { permission: 'Guides:Create', mode: 'create' } },
          { path: ':id/editar', component: GuideDetailComponent, canActivate: [permissionGuard], data: { permission: 'Guides:Update', mode: 'edit' } },
          { path: ':id', component: GuideDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'carriers',
        canActivate: [permissionGuard],
        data: { permission: 'Transport:List' },
        children: [
          { path: '', component: CarrierListComponent },
          { path: 'nuevo', component: CarrierFormComponent, canActivate: [permissionGuard], data: { permission: 'Transport:Create', mode: 'create' } },
          { path: ':id/editar', component: CarrierFormComponent, canActivate: [permissionGuard], data: { permission: 'Transport:Update', mode: 'edit' } },
          { path: ':id', component: CarrierDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'trucks',
        canActivate: [permissionGuard],
        data: { permission: 'Transport:List' },
        children: [
          { path: '', component: TruckListComponent },
          { path: 'nuevo', component: TruckFormComponent, canActivate: [permissionGuard], data: { permission: 'Transport:Create', mode: 'create' } },
          { path: ':id/editar', component: TruckFormComponent, canActivate: [permissionGuard], data: { permission: 'Transport:Update', mode: 'edit' } },
          { path: ':id', component: TruckDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'transport-rates',
        canActivate: [permissionGuard],
        data: { permission: 'Transport:List' },
        children: [
          { path: '', component: TransportRateListComponent },
          { path: 'nuevo', component: TransportRateFormComponent, canActivate: [permissionGuard], data: { permission: 'Transport:Create', mode: 'create' } },
          { path: ':id/editar', component: TransportRateFormComponent, canActivate: [permissionGuard], data: { permission: 'Transport:Update', mode: 'edit' } },
          { path: ':id', component: TransportRateDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'settlements',
        canActivate: [permissionGuard],
        data: { permission: 'Transport:List' },
        children: [
          { path: '', component: SettlementListComponent },
          { path: 'nuevo', component: SettlementFormComponent, canActivate: [permissionGuard], data: { permission: 'Transport:Create', mode: 'create' } },
          { path: ':id', component: SettlementDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'receptions',
        canActivate: [permissionGuard],
        data: { permission: 'Reception:List' },
        children: [
          { path: '', component: ReceptionListComponent },
          { path: 'nuevo', component: ReceptionFormComponent, canActivate: [permissionGuard], data: { permission: 'Reception:Create', mode: 'create' } },
          { path: ':id', component: ReceptionDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'shortages',
        canActivate: [permissionGuard],
        data: { permission: 'Reception:List' },
        children: [
          { path: '', component: ShortageListComponent },
          { path: 'nuevo', component: ShortageFormComponent, canActivate: [permissionGuard], data: { permission: 'Reception:Create', mode: 'create' } }
        ]
      },
      {
        path: 'inventory',
        canActivate: [permissionGuard],
        data: { permission: 'Inventory:List' },
        children: [
          { path: '', component: InventoryListComponent },
          { path: 'nuevo', component: InventoryFormComponent, canActivate: [permissionGuard], data: { permission: 'Inventory:Create', mode: 'create' } },
          { path: ':id/editar', component: InventoryFormComponent, canActivate: [permissionGuard], data: { permission: 'Inventory:Update', mode: 'edit' } },
          { path: ':id', component: InventoryDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'reception-confirmations',
        canActivate: [permissionGuard],
        data: { permission: 'Inventory:List' },
        children: [
          { path: '', component: ReceptionConfirmationListComponent },
          { path: 'nuevo', component: ReceptionConfirmationFormComponent, canActivate: [permissionGuard], data: { permission: 'Inventory:Update', mode: 'create' } }
        ]
      },
      {
        path: 'inventory-movements',
        canActivate: [permissionGuard],
        data: { permission: 'Inventory:List' },
        children: [
          { path: '', component: InventoryMovementListComponent },
          { path: 'nuevo', component: InventoryMovementFormComponent, canActivate: [permissionGuard], data: { permission: 'Inventory:Update', mode: 'create' } }
        ]
      },
      {
        path: 'sales',
        canActivate: [permissionGuard],
        data: { permission: 'Finance:List' },
        children: [
          { path: '', component: SaleListComponent },
          { path: 'nuevo', component: SaleFormComponent, canActivate: [permissionGuard], data: { permission: 'Finance:Create', mode: 'create' } },
          { path: ':id/editar', component: SaleFormComponent, canActivate: [permissionGuard], data: { permission: 'Finance:Update', mode: 'edit' } },
          { path: ':id', component: SaleDetailComponent, data: { mode: 'view' } }
        ]
      },
      {
        path: 'account-payables',
        canActivate: [permissionGuard],
        data: { permission: 'Finance:List' },
        children: [
          { path: '', component: AccountPayableListComponent },
          { path: 'nuevo', component: AccountPayableFormComponent, canActivate: [permissionGuard], data: { permission: 'Finance:Create', mode: 'create' } },
          { path: ':id/editar', component: AccountPayableFormComponent, canActivate: [permissionGuard], data: { permission: 'Finance:Update', mode: 'edit' } },
          { path: ':id', component: AccountPayableDetailComponent, data: { mode: 'view' } }
        ]
      },
      { path: 'account-statement', component: AccountStatementComponent, canActivate: [permissionGuard], data: { permission: 'Finance:List' } },
      { path: '', redirectTo: 'inicio', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
