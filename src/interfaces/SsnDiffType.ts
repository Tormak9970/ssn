enum SsnDiffType {
  /** We included the original file contents, not just the differences, because file is new or it's in a format that's not suitable for diffing. */
  NewFile = 0,
  /** File is not included in the .zip archive because it has been deleted. */
  Deleted = 1,
  /** File has changed and we include the differences, encoded in vcdiff/xdelta3 */
  Changed = 2,
  /** File is not included in the .zip archive because it hasn't changed */
  Unchanged = 3,
}

export default SsnDiffType;
