import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestsEditComponent } from './tests-edit.component';

describe('TestsEditComponent', () => {
  let component: TestsEditComponent;
  let fixture: ComponentFixture<TestsEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestsEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestsEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
