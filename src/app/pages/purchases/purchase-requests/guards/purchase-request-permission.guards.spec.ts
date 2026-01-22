import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
  PurchaseRequestListGuard,
  PurchaseRequestViewGuard,
  PurchaseRequestCreateGuard,
  PurchaseRequestEditGuard,
  PurchaseRequestPreauthorizeGuard,
  MyAuthorizationsGuard,
  PurchaseTrackingGuard
} from './purchase-request-permission.guards';
import { PurchaseRequestPermissionService } from '../services/purchase-request-permission.service';

describe('Purchase Request Permission Guards', () => {
  let router: Router;
  let mockPermissionService: jasmine.SpyObj<PurchaseRequestPermissionService>;

  beforeEach(() => {
    mockPermissionService = jasmine.createSpyObj('PurchaseRequestPermissionService', [
      'canListPurchaseRequests',
      'canViewPurchaseRequests',
      'canCreatePurchaseRequests',
      'canEditPurchaseRequests',
      'canPreauthorizePurchaseRequests',
      'canViewMyAuthorizations',
      'canViewTracking'
    ]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: PurchaseRequestPermissionService, useValue: mockPermissionService }
      ]
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  describe('PurchaseRequestListGuard', () => {
    it('should allow access when user has list permission', () => {
      mockPermissionService.canListPurchaseRequests.and.returnValue(true);

      TestBed.runInInjectionContext(() => {
        const result = PurchaseRequestListGuard({} as any, {} as any);
        expect(result).toBe(true);
      });
    });

    it('should deny access when user lacks list permission', () => {
      mockPermissionService.canListPurchaseRequests.and.returnValue(false);

      TestBed.runInInjectionContext(() => {
        const result = PurchaseRequestListGuard({} as any, {} as any);
        expect(result).toBe(false);
      });
    });
  });

  describe('PurchaseRequestCreateGuard', () => {
    it('should allow access when user has create permission', () => {
      mockPermissionService.canCreatePurchaseRequests.and.returnValue(true);

      TestBed.runInInjectionContext(() => {
        const result = PurchaseRequestCreateGuard({} as any, {} as any);
        expect(result).toBe(true);
      });
    });

    it('should deny access when user lacks create permission', () => {
      mockPermissionService.canCreatePurchaseRequests.and.returnValue(false);

      TestBed.runInInjectionContext(() => {
        const result = PurchaseRequestCreateGuard({} as any, {} as any);
        expect(result).toBe(false);
      });
    });
  });

  describe('PurchaseRequestPreauthorizeGuard', () => {
    it('should allow access when user has preauthorize permission', () => {
      mockPermissionService.canPreauthorizePurchaseRequests.and.returnValue(true);

      TestBed.runInInjectionContext(() => {
        const result = PurchaseRequestPreauthorizeGuard({} as any, {} as any);
        expect(result).toBe(true);
      });
    });

    it('should deny access when user lacks preauthorize permission', () => {
      mockPermissionService.canPreauthorizePurchaseRequests.and.returnValue(false);

      TestBed.runInInjectionContext(() => {
        const result = PurchaseRequestPreauthorizeGuard({} as any, {} as any);
        expect(result).toBe(false);
      });
    });
  });

  describe('MyAuthorizationsGuard', () => {
    it('should allow access when user has view authorizations permission', () => {
      mockPermissionService.canViewMyAuthorizations.and.returnValue(true);

      TestBed.runInInjectionContext(() => {
        const result = MyAuthorizationsGuard({} as any, {} as any);
        expect(result).toBe(true);
      });
    });

    it('should deny access when user lacks view authorizations permission', () => {
      mockPermissionService.canViewMyAuthorizations.and.returnValue(false);

      TestBed.runInInjectionContext(() => {
        const result = MyAuthorizationsGuard({} as any, {} as any);
        expect(result).toBe(false);
      });
    });
  });

  describe('PurchaseTrackingGuard', () => {
    it('should allow access when user has tracking permission', () => {
      mockPermissionService.canViewTracking.and.returnValue(true);

      TestBed.runInInjectionContext(() => {
        const result = PurchaseTrackingGuard({} as any, {} as any);
        expect(result).toBe(true);
      });
    });

    it('should deny access when user lacks tracking permission', () => {
      mockPermissionService.canViewTracking.and.returnValue(false);

      TestBed.runInInjectionContext(() => {
        const result = PurchaseTrackingGuard({} as any, {} as any);
        expect(result).toBe(false);
      });
    });
  });
});
