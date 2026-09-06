import { Injectable } from '@angular/core';
import { Observable, forkJoin, map, of, catchError, switchMap } from 'rxjs';
import { LoginResponse, RoleResponse } from '../models/auth.model';
import {
  DashboardBundle,
  DashboardSection,
  DashboardTable
} from '../models/dashboard.model';
import { SupplierResponse, StallResponse } from '../models/master.model';
import { CarrierResponse, TruckResponse, TransportRateResponse } from '../models/transport.model';
import { GuideResponse } from '../models/guide.model';
import { InventoryResponse, ReceptionConfirmationResponse } from '../models/merchant.model';
import { AccountPayableListResponse } from '../models/finance.model';
import { ApiResponse, PagedResponse } from '../models/api-response.model';
import { UserService } from './user.service';
import { RoleService } from './role.service';
import { SupplierService, StallService } from './master.service';
import { GuideService } from './guide.service';
import { CarrierService, SettlementService, TransportRateService, TruckService } from './transport.service';
import { ReceptionService, ShortageService } from './reception.service';
import { InventoryService, ReceptionConfirmationService } from './merchant.service';
import { AccountPayableService, SaleService } from './finance.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly bigPageSize = 500;

  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly supplierService: SupplierService,
    private readonly stallService: StallService,
    private readonly guideService: GuideService,
    private readonly carrierService: CarrierService,
    private readonly truckService: TruckService,
    private readonly transportRateService: TransportRateService,
    private readonly settlementService: SettlementService,
    private readonly receptionService: ReceptionService,
    private readonly shortageService: ShortageService,
    private readonly inventoryService: InventoryService,
    private readonly confirmationService: ReceptionConfirmationService,
    private readonly saleService: SaleService,
    private readonly accountPayableService: AccountPayableService
  ) {}

  loadDashboard(user: LoginResponse): Observable<DashboardBundle> {
    const sections: Observable<DashboardSection>[] = [];

    if (this.hasRole(user, 'Admin', 'Administrador')) {
      sections.push(this.loadAdminSection());
    }
    if (this.hasRole(user, 'Supplier', 'Proveedor')) {
      sections.push(this.loadSupplierSection(user));
    }
    if (this.hasRole(user, 'Carrier', 'Transportista')) {
      sections.push(this.loadCarrierSection(user));
    }
    if (this.hasRole(user, 'Merchant', 'Comerciante')) {
      sections.push(this.loadMerchantSection(user));
    }

    if (sections.length === 0) {
      return of({
        generatedAt: new Date().toISOString(),
        sections: [this.createGenericSection(user)]
      });
    }

    return forkJoin(sections).pipe(
      map(resolved => ({
        generatedAt: new Date().toISOString(),
        sections: resolved
      }))
    );
  }

  private loadAdminSection(): Observable<DashboardSection> {
    return forkJoin({
      users: this.safePaged(this.userService.list(undefined, 1, this.bigPageSize)),
      roles: this.safeApi(this.roleService.list(), [] as RoleResponse[]),
      suppliers: this.safeApi(this.supplierService.list(true), [] as SupplierResponse[]),
      carriers: this.safeApi(this.carrierService.list(true), [] as CarrierResponse[]),
      stalls: this.safeApi(this.stallService.list(true), [] as StallResponse[]),
      guides: this.safePaged(this.guideService.list(undefined, undefined, undefined, 1, this.bigPageSize)),
      receptions: this.safePaged(this.receptionService.list(undefined, undefined, undefined, undefined, 1, this.bigPageSize)),
      shortages: this.safePaged(this.shortageService.list(undefined, undefined, undefined, undefined, 1, this.bigPageSize)),
      settlements: this.safePaged(this.settlementService.list(undefined, undefined, undefined, undefined, 1, this.bigPageSize)),
      sales: this.safePaged(this.saleService.list(undefined, undefined, undefined, undefined, undefined, undefined, 1, this.bigPageSize)),
      accountPayables: this.safePaged(this.accountPayableService.list(undefined, undefined, undefined, undefined, undefined, undefined, 1, this.bigPageSize))
    }).pipe(
      map(({ users, roles, suppliers, carriers, stalls, guides, receptions, shortages, settlements, sales, accountPayables }) => {
        const activeUsers = users.data.filter(item => item.status === 1).length;
        const grossSales = this.sumBy(sales.data, item => item.totalAmount);
        const openDebt = this.sumBy(accountPayables.data.filter(item => !this.isPaid(item.accountStatus)), item => item.balance);
        const topSuppliersMap = new Map<string, { supplierName: string; guideCount: number; transportCost: number }>();

        for (const guide of guides.data) {
          const current = topSuppliersMap.get(guide.supplierName) ?? {
            supplierName: guide.supplierName,
            guideCount: 0,
            transportCost: 0
          };

          current.guideCount += 1;
          current.transportCost += guide.totalTransportCost;
          topSuppliersMap.set(guide.supplierName, current);
        }

        const topSuppliers = [...topSuppliersMap.values()]
          .sort((left, right) => right.guideCount - left.guideCount)
          .slice(0, 6)
          .map(item => ({
            supplierName: item.supplierName,
            guideCount: item.guideCount,
            transportCost: item.transportCost
          }));

        return {
          roleKey: 'admin',
          titleKey: 'dashboardPage.admin.title',
          subtitleKey: 'dashboardPage.admin.subtitle',
          metrics: [
            { key: 'users', labelKey: 'dashboardPage.metrics.totalUsers', value: users.totalRecords, format: 'number', tone: 'neutral' },
            { key: 'activeUsers', labelKey: 'dashboardPage.metrics.activeUsers', value: activeUsers, format: 'number', tone: 'positive' },
            { key: 'roles', labelKey: 'dashboardPage.metrics.roles', value: roles.length, format: 'number', tone: 'neutral' },
            { key: 'guides', labelKey: 'dashboardPage.metrics.guides', value: guides.totalRecords, format: 'number', tone: 'neutral' },
            { key: 'grossSales', labelKey: 'dashboardPage.metrics.grossSales', value: grossSales, format: 'currency', tone: 'positive' },
            { key: 'openDebt', labelKey: 'dashboardPage.metrics.openDebt', value: openDebt, format: 'currency', tone: 'warning' }
          ],
          insights: [
            { labelKey: 'dashboardPage.insights.suppliers', value: suppliers.length, format: 'number' },
            { labelKey: 'dashboardPage.insights.carriers', value: carriers.length, format: 'number' },
            { labelKey: 'dashboardPage.insights.stalls', value: stalls.length, format: 'number' },
            { labelKey: 'dashboardPage.insights.receptions', value: receptions.totalRecords, format: 'number' },
            { labelKey: 'dashboardPage.insights.shortages', value: shortages.totalRecords, format: 'number' },
            { labelKey: 'dashboardPage.insights.settlements', value: settlements.totalRecords, format: 'number' }
          ],
          table: this.createTable(
            'dashboardPage.tables.topSuppliers',
            'dashboardPage.tables.emptyAdmin',
            [
              { key: 'supplierName', labelKey: 'dashboardPage.columns.supplier', format: 'text' },
              { key: 'guideCount', labelKey: 'dashboardPage.columns.guideCount', format: 'number' },
              { key: 'transportCost', labelKey: 'dashboardPage.columns.transportCost', format: 'currency' }
            ],
            topSuppliers
          )
        };
      })
    );
  }

  private loadSupplierSection(user: LoginResponse): Observable<DashboardSection> {
    return this.safeApi(this.supplierService.list(true), [] as SupplierResponse[]).pipe(
      map(suppliers => suppliers.find(item => item.userId === user.userId) ?? null),
      switchMap(supplier => supplier
        ? this.createSupplierDetailSection(supplier)
        : of<DashboardSection>({
            roleKey: 'supplier',
            titleKey: 'dashboardPage.supplier.title',
            subtitleKey: 'dashboardPage.supplier.unlinked',
            metrics: [],
            insights: []
          }))
    );
  }

  private loadCarrierSection(user: LoginResponse): Observable<DashboardSection> {
    return this.safeApi(this.carrierService.list(true), [] as CarrierResponse[]).pipe(
      map(carriers => carriers.find(item => item.userId === user.userId) ?? null),
      switchMap(carrier => carrier
        ? this.createCarrierDetailSection(carrier)
        : of<DashboardSection>({
            roleKey: 'carrier',
            titleKey: 'dashboardPage.carrier.title',
            subtitleKey: 'dashboardPage.carrier.unlinked',
            metrics: [],
            insights: []
          }))
    );
  }

  private loadMerchantSection(user: LoginResponse): Observable<DashboardSection> {
    return this.safeApi(this.stallService.list(true), [] as StallResponse[]).pipe(
      map(stalls => stalls.find(item => item.userId === user.userId) ?? null),
      switchMap(stall => stall
        ? this.createMerchantDetailSection(stall)
        : of<DashboardSection>({
            roleKey: 'merchant',
            titleKey: 'dashboardPage.merchant.title',
            subtitleKey: 'dashboardPage.merchant.unlinked',
            metrics: [],
            insights: []
          }))
    );
  }

  private createGenericSection(user: LoginResponse): DashboardSection {
    return {
      roleKey: 'generic',
      titleKey: 'dashboardPage.generic.title',
      subtitleKey: 'dashboardPage.generic.subtitle',
      metrics: [
        { key: 'roles', labelKey: 'dashboardPage.metrics.roles', value: user.roles.length, format: 'number', tone: 'neutral' }
      ],
      insights: [
        { labelKey: 'dashboardPage.insights.currentRoles', value: user.roles.join(', '), format: 'text' }
      ]
    };
  }

  private createSupplierDetailSection(supplier: SupplierResponse): Observable<DashboardSection> {
    return forkJoin({
      guides: this.safeApi(this.guideService.listBySupplier(supplier.id), [] as GuideResponse[]),
      accountPayables: this.safePaged(this.accountPayableService.list(undefined, supplier.id, undefined, undefined, undefined, undefined, 1, this.bigPageSize))
    }).pipe(
      map(({ guides, accountPayables }) => {
        const totalTransportCost = this.sumBy(guides, item => item.totalTransportCost);
        const paidAmount = this.sumBy(accountPayables.data, item => item.paidAmount);
        const pendingBalance = this.sumBy(accountPayables.data.filter(item => !this.isPaid(item.accountStatus)), item => item.balance);
        const inTransit = guides.filter(item => this.hasAnyStatus(item.guideStatus, 'InTransit', 'EnTransito', 'En Tránsito')).length;
        const delivered = guides.filter(item => this.hasAnyStatus(item.guideStatus, 'Received', 'Recibida', 'Cerrada', 'Closed')).length;
        const recentGuides = [...guides]
          .sort((left, right) => new Date(right.shipmentDate).getTime() - new Date(left.shipmentDate).getTime())
          .slice(0, 6)
          .map(item => ({
            guideNumber: item.guideNumber,
            status: item.guideStatus,
            shipmentDate: item.shipmentDate,
            transportCost: item.totalTransportCost
          }));

        return {
          roleKey: 'supplier',
          titleKey: 'dashboardPage.supplier.title',
          subtitleKey: 'dashboardPage.supplier.subtitle',
          metrics: [
            { key: 'guides', labelKey: 'dashboardPage.metrics.guides', value: guides.length, format: 'number', tone: 'neutral' },
            { key: 'inTransit', labelKey: 'dashboardPage.metrics.inTransit', value: inTransit, format: 'number', tone: 'warning' },
            { key: 'delivered', labelKey: 'dashboardPage.metrics.delivered', value: delivered, format: 'number', tone: 'positive' },
            { key: 'transportCost', labelKey: 'dashboardPage.metrics.transportCost', value: totalTransportCost, format: 'currency', tone: 'neutral' },
            { key: 'paidAmount', labelKey: 'dashboardPage.metrics.collected', value: paidAmount, format: 'currency', tone: 'positive' },
            { key: 'pendingBalance', labelKey: 'dashboardPage.metrics.pendingCollection', value: pendingBalance, format: 'currency', tone: 'warning' }
          ],
          insights: [
            { labelKey: 'dashboardPage.insights.supplierName', value: supplier.businessName, format: 'text' },
            { labelKey: 'dashboardPage.insights.taxId', value: supplier.taxId, format: 'text' },
            { labelKey: 'dashboardPage.insights.department', value: supplier.department || '—', format: 'text' },
            { labelKey: 'dashboardPage.insights.contactName', value: supplier.contactName || '—', format: 'text' }
          ],
          table: this.createTable(
            'dashboardPage.tables.recentGuides',
            'dashboardPage.tables.emptySupplier',
            [
              { key: 'guideNumber', labelKey: 'dashboardPage.columns.guide', format: 'text' },
              { key: 'status', labelKey: 'dashboardPage.columns.status', format: 'text' },
              { key: 'shipmentDate', labelKey: 'dashboardPage.columns.shipmentDate', format: 'text' },
              { key: 'transportCost', labelKey: 'dashboardPage.columns.transportCost', format: 'currency' }
            ],
            recentGuides
          )
        };
      })
    );
  }

  private createCarrierDetailSection(carrier: CarrierResponse): Observable<DashboardSection> {
    return forkJoin({
      trucks: this.safeApi(this.truckService.listByCarrier(carrier.id), [] as TruckResponse[]),
      rates: this.safeApi(this.transportRateService.listByCarrier(carrier.id), [] as TransportRateResponse[]),
      guides: this.safePaged(this.guideService.list(undefined, undefined, carrier.id, 1, this.bigPageSize)),
      settlements: this.safePaged(this.settlementService.list(undefined, carrier.id, undefined, undefined, 1, this.bigPageSize))
    }).pipe(
      map(({ trucks, rates, guides, settlements }) => {
        const activeTrucks = trucks.filter(item => item.status).length;
        const activeRates = rates.filter(item => item.status).length;
        const paidSettlements = settlements.data.filter(item => this.isPaid(item.settlementStatus)).length;
        const pendingAmount = this.sumBy(settlements.data.filter(item => !this.isPaid(item.settlementStatus)), item => item.totalAmount);
        const recentSettlements = [...settlements.data]
          .sort((left, right) => new Date(right.tripDate).getTime() - new Date(left.tripDate).getTime())
          .slice(0, 6)
          .map(item => ({
            settlementId: item.id,
            tripDate: item.tripDate,
            truckPlate: item.truckPlate,
            status: item.settlementStatus,
            totalAmount: item.totalAmount
          }));

        return {
          roleKey: 'carrier',
          titleKey: 'dashboardPage.carrier.title',
          subtitleKey: 'dashboardPage.carrier.subtitle',
          metrics: [
            { key: 'assignedGuides', labelKey: 'dashboardPage.metrics.assignedGuides', value: guides.totalRecords, format: 'number', tone: 'neutral' },
            { key: 'trips', labelKey: 'dashboardPage.metrics.trips', value: settlements.totalRecords, format: 'number', tone: 'neutral' },
            { key: 'activeTrucks', labelKey: 'dashboardPage.metrics.activeTrucks', value: activeTrucks, format: 'number', tone: 'positive' },
            { key: 'activeRates', labelKey: 'dashboardPage.metrics.activeRates', value: activeRates, format: 'number', tone: 'positive' },
            { key: 'paidSettlements', labelKey: 'dashboardPage.metrics.paidSettlements', value: paidSettlements, format: 'number', tone: 'positive' },
            { key: 'pendingAmount', labelKey: 'dashboardPage.metrics.pendingSettlementAmount', value: pendingAmount, format: 'currency', tone: 'warning' }
          ],
          insights: [
            { labelKey: 'dashboardPage.insights.carrierName', value: `${carrier.firstName} ${carrier.lastName}`, format: 'text' },
            { labelKey: 'dashboardPage.insights.documentId', value: carrier.documentId, format: 'text' },
            { labelKey: 'dashboardPage.insights.licenseNumber', value: carrier.licenseNumber, format: 'text' },
            { labelKey: 'dashboardPage.insights.phone', value: carrier.phone, format: 'text' }
          ],
          table: this.createTable(
            'dashboardPage.tables.recentSettlements',
            'dashboardPage.tables.emptyCarrier',
            [
              { key: 'settlementId', labelKey: 'dashboardPage.columns.settlement', format: 'number' },
              { key: 'tripDate', labelKey: 'dashboardPage.columns.tripDate', format: 'text' },
              { key: 'truckPlate', labelKey: 'dashboardPage.columns.truck', format: 'text' },
              { key: 'status', labelKey: 'dashboardPage.columns.status', format: 'text' },
              { key: 'totalAmount', labelKey: 'dashboardPage.columns.totalAmount', format: 'currency' }
            ],
            recentSettlements
          )
        };
      })
    );
  }

  private createMerchantDetailSection(stall: StallResponse): Observable<DashboardSection> {
    return forkJoin({
      inventory: this.safeApi(this.inventoryService.listByStall(stall.id), [] as InventoryResponse[]),
      lowStock: this.safeApi(this.inventoryService.list(stall.id, undefined, true), [] as InventoryResponse[]),
      sales: this.safePaged(this.saleService.list(stall.id, undefined, undefined, undefined, undefined, undefined, 1, this.bigPageSize)),
      accountPayables: this.safeApi(this.accountPayableService.listByStall(stall.id), [] as AccountPayableListResponse[]),
      confirmations: this.safeApi(this.confirmationService.listByStall(stall.id), [] as ReceptionConfirmationResponse[]),
      guides: this.safeApi(this.guideService.listByStall(stall.id), [] as GuideResponse[])
    }).pipe(
      map(({ inventory, lowStock, sales, accountPayables, confirmations, guides }) => {
        const inventoryValue = this.sumBy(inventory, item => item.currentStock * item.averageCost);
        const salesAmount = this.sumBy(sales.data, item => item.totalAmount);
        const debtBalance = this.sumBy(accountPayables.filter(item => !this.isPaid(item.accountStatus)), item => item.balance);
        const topInventory = [...inventory]
          .sort((left, right) => right.currentStock - left.currentStock)
          .slice(0, 6)
          .map(item => ({
            productName: item.productName,
            currentStock: item.currentStock,
            minimumStock: item.minimumStock,
            averageCost: item.averageCost
          }));

        return {
          roleKey: 'merchant',
          titleKey: 'dashboardPage.merchant.title',
          subtitleKey: 'dashboardPage.merchant.subtitle',
          metrics: [
            { key: 'inventoryItems', labelKey: 'dashboardPage.metrics.inventoryItems', value: inventory.length, format: 'number', tone: 'neutral' },
            { key: 'lowStock', labelKey: 'dashboardPage.metrics.lowStock', value: lowStock.length, format: 'number', tone: 'warning' },
            { key: 'inventoryValue', labelKey: 'dashboardPage.metrics.inventoryValue', value: inventoryValue, format: 'currency', tone: 'neutral' },
            { key: 'salesCount', labelKey: 'dashboardPage.metrics.salesCount', value: sales.totalRecords, format: 'number', tone: 'positive' },
            { key: 'salesAmount', labelKey: 'dashboardPage.metrics.salesAmount', value: salesAmount, format: 'currency', tone: 'positive' },
            { key: 'debtBalance', labelKey: 'dashboardPage.metrics.debtBalance', value: debtBalance, format: 'currency', tone: 'danger' }
          ],
          insights: [
            { labelKey: 'dashboardPage.insights.stallNumber', value: stall.number, format: 'text' },
            { labelKey: 'dashboardPage.insights.pavilion', value: stall.pavilionName, format: 'text' },
            { labelKey: 'dashboardPage.insights.owner', value: stall.ownerName, format: 'text' },
            { labelKey: 'dashboardPage.insights.confirmations', value: confirmations.length, format: 'number' },
            { labelKey: 'dashboardPage.insights.assignedGuides', value: guides.length, format: 'number' },
            { labelKey: 'dashboardPage.insights.pendingAccounts', value: accountPayables.filter(item => !this.isPaid(item.accountStatus)).length, format: 'number' }
          ],
          table: this.createTable(
            'dashboardPage.tables.topInventory',
            'dashboardPage.tables.emptyMerchant',
            [
              { key: 'productName', labelKey: 'dashboardPage.columns.product', format: 'text' },
              { key: 'currentStock', labelKey: 'dashboardPage.columns.currentStock', format: 'number' },
              { key: 'minimumStock', labelKey: 'dashboardPage.columns.minimumStock', format: 'number' },
              { key: 'averageCost', labelKey: 'dashboardPage.columns.averageCost', format: 'currency' }
            ],
            topInventory
          )
        };
      })
    );
  }

  private safeApi<T>(source: Observable<ApiResponse<T>>, fallback: T): Observable<T> {
    return source.pipe(
      map(response => response.success ? response.data : fallback),
      catchError(() => of(fallback))
    );
  }

  private safePaged<T>(source: Observable<PagedResponse<T>>): Observable<PagedResponse<T>> {
    return source.pipe(
      catchError(() => of(this.emptyPaged<T>()))
    );
  }

  private emptyPaged<T>(): PagedResponse<T> {
    return {
      success: true,
      data: [],
      totalRecords: 0,
      pageNumber: 1,
      pageSize: this.bigPageSize,
      totalPages: 0
    };
  }

  private hasRole(user: LoginResponse, ...roles: string[]): boolean {
    const normalized = user.roles.map(item => item.toLowerCase());
    return roles.some(role => normalized.includes(role.toLowerCase()));
  }

  private matchesStatus(status: string | null | undefined, expected: string): boolean {
    return (status ?? '').toLowerCase() === expected.toLowerCase();
  }

  private hasAnyStatus(status: string | null | undefined, ...expected: string[]): boolean {
    return expected.some(item => this.matchesStatus(status, item));
  }

  private isPaid(status: string | null | undefined): boolean {
    const value = (status ?? '').toLowerCase();
    return value === 'paid' || value === 'pagado';
  }

  private sumBy<T>(items: T[], resolver: (item: T) => number): number {
    return items.reduce((acc, item) => acc + resolver(item), 0);
  }

  private createTable(
    titleKey: string,
    emptyKey: string,
    columns: DashboardTable['columns'],
    rows: DashboardTable['rows']
  ): DashboardTable {
    return { titleKey, emptyKey, columns, rows };
  }
}
