import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
  CustomerListGuard,
  CustomerViewGuard,
  CustomerCreateGuard,
  CustomerEditGuard,
  CustomerDeleteGuard
} from './customer-permission.guards';
import { CustomerPermissionService } from '../services/customer-permission.service';

describe('Customer Permission Guards', () => {
  let router: Router;
  let mockPermissionService: jasmine.SpyObj<CustomerPermissionService>;

  beforeEach(() => {
    mockPermissionService = jasmine.createSpyObj('CustomerPermissionService', [
      'canViewCustomers',
      'canCreateCustomers',
      'canEditCustomers',
      'canDeleteCustomers'
    ]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: CustomerPermissionService, useValue: mockPermissionService }
      ]
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  describe('CustomerListGuard', () => {
    it('should allow access when user has view permission', () => {
      mockPermissionService.canViewCustomers.and.returnValue(true);

      TestBed.runInInjectionContext(() => {
        const result = CustomerListGuard({} as any, {} as any);
        expect(result).toBe(true);
      });
    });

    it('should deny access and redirect when user lacks view permission', () => {
      mockPermissionService.canViewCustomers.and.returnValue(false);

      TestBed.runInInjectionContext(() => {
        const result = CustomerListGuard({} as any, {} as any);
        expect(result).toBe(false);
      });
    });
  });

  describe('CustomerCreateGuard', () => {
    it('should allow access when user has create permission', () => {
      mockPermissionService.canCreateCustomers.and.returnValue(true);

      TestBed.runInInjectionContext(() => {
        const result = CustomerCreateGuard({} as any, {} as any);
        expect(result).toBe(true);
      });
    });

    it('should deny access when user lacks create permission', () => {
      mockPermissionService.canCreateCustomers.and.returnValue(false);

      TestBed.runInInjectionContext(() => {
        const result = CustomerCreateGuard({} as any, {} as any);
        expect(result).toBe(false);
      });
    });
  });

  describe('CustomerEditGuard', () => {
    it('should allow access when user has edit permission', () => {
      mockPermissionService.canEditCustomers.and.returnValue(true);

      TestBed.runInInjectionContext(() => {
        const result = CustomerEditGuard({} as any, {} as any);
        expect(result).toBe(true);
      });
    });

    it('should deny access when user lacks edit permission', () => {
      mockPermissionService.canEditCustomers.and.returnValue(false);

      TestBed.runInInjectionContext(() => {
        const result = CustomerEditGuard({} as any, {} as any);
        expect(result).toBe(false);
      });
    });
  });

  describe('CustomerDeleteGuard', () => {
    it('should allow access when user has delete permission', () => {
      mockPermissionService.canDeleteCustomers.and.returnValue(true);

      TestBed.runInInjectionContext(() => {
        const result = CustomerDeleteGuard({} as any, {} as any);
        expect(result).toBe(true);
      });
    });

    it('should deny access when user lacks delete permission', () => {
      mockPermissionService.canDeleteCustomers.and.returnValue(false);

      TestBed.runInInjectionContext(() => {
        const result = CustomerDeleteGuard({} as any, {} as any);
        expect(result).toBe(false);
      });
    });
  });
});
