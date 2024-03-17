export default interface Violation {
  line_no?: number,
  line_pos?: number,
  start_line_no?: number,
  start_line_pos?: number,
  end_line_no?: number,
  end_line_pos?: number,
  description: string,
  code: string,
}
