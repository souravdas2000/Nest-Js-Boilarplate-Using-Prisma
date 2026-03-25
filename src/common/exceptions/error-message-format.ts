export const errorMesssgeFormat = (message: any) => {
  switch (typeof message) {
    case 'string':
      return message;
    case 'object':
      return message?.join(', ');
    default:
      return message;
  }
};
