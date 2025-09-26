import React from 'react';
import Button from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const CartIcon = ({ onClick, className = '' }) => {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={`relative ${className}`}
      size="sm"
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      Cart
      {itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs font-bold"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Button>
  );
};

export default CartIcon;