import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestsViewComponent } from './tests-view.component';

describe('TestsViewComponent', () => {
  let component: TestsViewComponent;
  let fixture: ComponentFixture<TestsViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestsViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestsViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
