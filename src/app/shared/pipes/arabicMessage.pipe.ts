import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'arabicMessage' })
export class ArabicMessagePipe implements PipeTransform {
  transform(value: string): string {
    const messageMap: { [key: string]: string } = {
      'Check-in successful': 'تم تسجيل الحضور بنجاح',
      'Check-out successful': 'تم تسجيل الانصراف بنجاح',
    };
    return messageMap[value] || value;
  }
}

@Pipe({ name: 'arabicError' })
export class ArabicErrorPipe implements PipeTransform {
  transform(value: string): string {
    // Use same mapping as translateError
    const errorMap: { [key: string]: string } = {
      'Check-in failed: Unauthorized: Invalid user ID':
        'فشل تسجيل الحضور: غير مصرح: معرف المستخدم غير صالح',
      // Add other mappings
    };
    return errorMap[value] || value;
  }
}
