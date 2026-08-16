import styled from 'styled-components/native';

export const StyledText = styled.Text<{
  $fontFamily: string;
  $fontSize: number;
  $letterSpacing: number;
  $textTransform: 'none' | 'uppercase';
  $color: string;
}>`
  font-family: ${({ $fontFamily }) => $fontFamily};
  font-size: ${({ $fontSize }) => $fontSize}px;
  letter-spacing: ${({ $letterSpacing }) => $letterSpacing}px;
  text-transform: ${({ $textTransform }) => $textTransform};
  color: ${({ $color }) => $color};
`;
