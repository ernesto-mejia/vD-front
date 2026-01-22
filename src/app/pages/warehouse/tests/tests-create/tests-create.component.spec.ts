import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TestsCreateComponent } from './tests-create.component';

describe('TestsCreateComponent', () => {
  let component: TestsCreateComponent;
  let fixture: ComponentFixture<TestsCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestsCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestsCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
