import { getStudentInfo, getStudentAvatarRaw } from "../adapters/user"

export async function getStudentAvatar() {
  const studentInfo = await getStudentInfo()
  const avatarId = studentInfo.avatarId
  const blob = await getStudentAvatarRaw(avatarId)
  return { src: URL.createObjectURL(blob) , blob}
}
