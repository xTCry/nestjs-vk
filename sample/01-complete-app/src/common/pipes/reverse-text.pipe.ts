import { Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ReverseTextPipe implements PipeTransform {
  transform(value?: string): string {
    if (!value) return value;
    return value.split('').reverse().join('');
  }
}
