import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.scss'],
})
export class AdminSidebarComponent {
  @Input() collapsed = false;
  @Input() isMobile = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  navItems: NavItem[] = [
    { label: 'لوحة القيادة', icon: 'dashboard', route: '/app/admin' },
    {
      label: 'الموظفين',
      icon: 'people',
      route: '/app/admin/employees',
      children: [
        {
          label: 'قائمة الموظفين',
          icon: 'list',
          route: '/app/admin/employees',
        },
        {
          label: 'إضافة موظف',
          icon: 'person_add',
          route: '/app/admin/add-employee',
        },
      ],
      expanded: false,
    },

    {
      label: 'الحضور والانصراف',
      icon: 'schedule',
      route: '/app/admin/attendance',
      children: [
        {
          label: 'سجل الحضور',
          icon: 'fact_check',
          route: '/app/admin/attendance/log',
        },
        {
          label: 'التقارير',
          icon: 'bar_chart',
          route: '/app/admin/attendance/reports',
        },
      ],
      expanded: false,
    },
    {
      label: 'الرواتب',
      icon: 'payments',
      route: '/app/admin/payroll',
      children: [
        {
          label: 'كشف الرواتب',
          icon: 'receipt_long',
          route: '/app/admin/payroll/list',
        },
        {
          label: 'إعدادات الرواتب',
          icon: 'settings',
          route: '/app/admin/payroll/settings',
        },
      ],
      expanded: false,
    },
    { label: 'مناوبات الموظفين', icon: 'schedule', route: '/app/admin/shifts' },
    {
      label: 'إدارة الصلاحيات',
      icon: 'admin_panel_settings',
      route: 'user-roles',
    },
    { label: 'الفروع', icon: 'business', route: '/app/admin/branches' },
    {
      label: 'الاشعارات',
      icon: 'notifications',
      route: '/app/admin/notification',
    },
    {
      label: 'الإجازات',
      icon: 'event',
      route: '/app/admin/holidays',
    },
    { label: 'الإعدادات', icon: 'settings', route: '/app/admin/settings' },
  ];

  toggleSubMenu(item: NavItem): void {
    if (this.collapsed && !this.isMobile) {
      this.toggleSidebar.emit();
      setTimeout(() => {
        item.expanded = !item.expanded;
      }, 300);
    } else {
      item.expanded = !item.expanded;
    }
  }

  closeOtherSubMenus(currentItem: NavItem): void {
    this.navItems.forEach((item) => {
      if (item !== currentItem && item.children) {
        item.expanded = false;
      }
    });
  }

  isActive(route: string): boolean {
    return window.location.pathname.startsWith(route);
  }

  isChildActive(item: NavItem): boolean {
    if (!item.children) return false;
    return item.children.some((child) => this.isActive(child.route));
  }

  onNavItemClick(item: NavItem, event: MouseEvent): void {
    if (item.children && item.children.length > 0) {
      event.preventDefault();
      this.toggleSubMenu(item);
      this.closeOtherSubMenus(item);
    } else if (this.isMobile) {
      this.toggleSidebar.emit();
    }
  }

  handleCollapseClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    console.log('Collapse button clicked');
    this.toggleSidebar.emit();
  }
}
