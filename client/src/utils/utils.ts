import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const ensureHexZeroPrefix = (address: string) => {
  // If address already starts with '0x0', return it as is
  if (address.startsWith('0x0')) {
    return address;
  }
  
  // If address starts with '0x' but not '0x0', insert a '0' after '0x'
  if (address.startsWith('0x')) {
    return '0x0' + address.substring(2);
  }
  
  // If address doesn't start with '0x', add '0x0' prefix
  return '0x0' + address;
}